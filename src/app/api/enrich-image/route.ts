import { NextResponse } from 'next/server'
import { enrichListingFromImage } from '@/lib/image-enrichment'
import { createClient } from '@/lib/supabase/server'

/**
 * Accepts an uploaded listing photo, stores it in Supabase Storage,
 * runs reverse-image enrichment, and returns suggested listing fields.
 */
export const POST = async (request: Request) => {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const base64 = bytes.toString('base64')
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('listing-photos')
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('listing-photos').getPublicUrl(path)

    const enrichment = await enrichListingFromImage({
      base64,
      imageUrl: publicUrl,
      filename: file.name,
    })

    return NextResponse.json({
      imageUrl: publicUrl,
      imagePath: path,
      enrichment,
      providersConfigured: {
        googleVision: Boolean(process.env.GOOGLE_VISION_API_KEY),
        serpApi: Boolean(process.env.SERPAPI_KEY),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
