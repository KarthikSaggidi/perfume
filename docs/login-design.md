# Login design assets

The customer and administrator forms are real HTML components styled in `app/auth.css`, sharing `components/auth/AuthShell.tsx`. The account screen switches to the existing authenticated dashboard after a successful OTP verification. No form text or controls are embedded in the background image.

Final project asset: [`public/images/velora-login-backdrop.webp`](../public/images/velora-login-backdrop.webp), 1672 × 941 pixels. The generated source was encoded as WebP at quality 92 for delivery. The page uses a cover background and preserves the supplied desktop composition; the login cards reflow independently on mobile.

Mode: built-in `image_gen` editing, using the supplied **Velora Fragrances OTP Login Screen.png** as the edit target. The original attachment was preserved. The wordmark, gold waves, icons, borders, and glass effects are code and SVG.

Final image-generation prompt:

> Use case: precise-object-edit. Asset type: full-screen photographic background for a responsive fragrance website login. Edit target: the attached Velora OTP login screenshot. Remove the entire centered white login card including all its lettering, controls, logo, white panel, and gold wave lines. Seamlessly reconstruct the photographic scene behind it. Preserve exactly the surrounding photo composition: sun-warmed stone arch across the middle/top, mountain landscape and warm peach sky on the left, oversized upright peach-pink perfume bottle with dark cylindrical cap and gold collar at the right, soft pink rose at lower right, blurred petals and warm stone in foreground. Keep the existing soft-focus cinematic shallow-depth-of-field blur, warm beige/rose/gold colors, and natural light. Preserve the full wide 16:9 composition, high-resolution full-HD quality. The output must be only a clean photographic backdrop edge to edge, with no UI panel, no form, no interface text, no frame, no watermark. Where the panel was, fill with plausible softly blurred stone arch and landscape continuing the surroundings. Do not add extra products or objects.

Administrator recovery uses the existing private server reset command. Remember me changes cookie persistence while retaining the server's eight-hour session limit. Customer SMS delivery uses the existing configured provider; this visual update does not change provider credentials or enable paid SMS sending.
