const DEFAULT_VIEWPORT_WIDTH = 1280
const DEFAULT_VIEWPORT_HEIGHT = 800

function jpegResponse(body: BodyInit, status = 200): Response {
	return new Response(body, {
		status,
		headers: {
			'Content-Type': 'image/jpeg',
			'Cache-Control': 'public, max-age=86400',
		},
	})
}

async function getCachedImage(
	key: string,
	env: Env,
	headers: Headers,
	params: URLSearchParams,
): Promise<Response | null> {
	try {
		const transforms = [
			`quality=${params.get('quality') || '80'}`,
			`width=${params.get('width') || '500'}`,
			`format=${params.get('format') || 'auto'}`,
			`fit=${params.get('fit') || 'cover'}`,
		]
		for (const name of ['height', 'gravity'] as const) {
			const value = params.get(name)
			if (value) transforms.push(`${name}=${value}`)
		}

		const response = await fetch(
			`${env.IMAGE_URL}/${key}/${transforms.join(',')}`,
			{ headers },
		)

		if (response.ok || response.status === 304) return response
		if (response.status !== 404 && response.status !== 204) {
			console.error('Image resize error:', response.status)
		}
	} catch (error) {
		console.error('Image resize error:', error)
	}

	try {
		const response = await fetch(`${env.CLOUDFLARE_API_URL}/${key}/blob`, {
			headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
		})

		if (response.ok && response.body) {
			return jpegResponse(response.body)
		}
		if (response.status !== 404 && response.status !== 204) {
			console.error('Image fetch error:', response.status)
		}
	} catch (error) {
		console.error('Image fetch error:', error)
	}

	return null
}

async function deleteImage(key: string, env: Env): Promise<void> {
	try {
		await fetch(`${env.CLOUDFLARE_API_URL}/${key}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
		})
	} catch (error) {
		console.error('Image delete error:', error)
	}
}

async function uploadImage(
	key: string,
	blob: Blob,
	buffer: ArrayBuffer,
	env: Env,
): Promise<Response> {
	const formData = new FormData()
	formData.append('file', blob)
	formData.append('id', key)
	formData.append(
		'metadata',
		JSON.stringify({ id: crypto.randomUUID(), key }),
	)
	formData.append('requireSignedURLs', 'false')

	const response = await fetch(env.CLOUDFLARE_API_URL, {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
		body: formData,
	})

	if (!response.ok) {
		try {
			const data: { errors: { message: string }[] } = await response.json()
			return new Response(
				`Upload failed: ${data.errors.map((e) => e.message).join(', ')}`,
				{ status: response.status },
			)
		} catch {
			return new Response('Upload failed', { status: response.status })
		}
	}

	return jpegResponse(buffer)
}

async function takeScreenshot(
	screenshotUrl: string,
	viewportWidth: number,
	viewportHeight: number,
	env: Env,
): Promise<{ blob: Blob; buffer: ArrayBuffer }> {
	const response = await fetch(
		`${env.HEADLESS_API_URL}/screenshot/${screenshotUrl}`,
		{
			headers: {
				'X-Prerender-Token': env.HEADLESS_API_TOKEN,
				'prerender-viewport-width': String(viewportWidth),
				'prerender-viewport-height': String(viewportHeight),
				'prerender-device-width': String(viewportWidth),
				'prerender-device-height': String(viewportHeight),
				'prerender-screenshot-format': 'jpeg',
				'prerender-wait-extra-long': 'true',
			},
		},
	)

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`Headless API error: ${text}`)
	}

	const buffer = await response.arrayBuffer()
	return { buffer, blob: new Blob([buffer], { type: 'image/jpeg' }) }
}

export async function handleRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return new Response('Method not allowed', { status: 405 })
	}

	const url = new URL(request.url)
	const path = url.pathname.replace(/^\/+|\/+$/g, '')

	if (!path) {
		return new Response('Missing path', { status: 400 })
	}

	const baseUrl = env.SITE_BASE_URL.replace(/\/+$/, '')
	const screenshotUrl = `${baseUrl}/${path}`
	const invalidate = url.searchParams.get('invalidate') === 'true'
	const key = `${path.replace(/\//g, '--')}.jpeg`
	const vw = Number(url.searchParams.get('vw')) || DEFAULT_VIEWPORT_WIDTH
	const vh = Number(url.searchParams.get('vh')) || DEFAULT_VIEWPORT_HEIGHT

	if (!invalidate) {
		const cached = await getCachedImage(
			key,
			env,
			request.headers,
			url.searchParams,
		)
		if (cached) return cached
	} else {
		await deleteImage(key, env)
	}

	try {
		const { blob, buffer } = await takeScreenshot(
			screenshotUrl,
			vw,
			vh,
			env,
		)
		return await uploadImage(key, blob, buffer, env)
	} catch (error) {
		console.error('Screenshot error:', error)
		return new Response('Failed to generate screenshot', { status: 500 })
	}
}
