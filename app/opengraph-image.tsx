import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// (#61) OG-image для главной страницы
export default function OGImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 100,
                        height: 100,
                        background: '#ffffff',
                        marginBottom: 32,
                    }}
                >
                    <span style={{ fontSize: 56, fontWeight: 900, color: '#111827' }}>=</span>
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: 64,
                        fontWeight: 800,
                        color: '#ffffff',
                        marginBottom: 16,
                        letterSpacing: '-2px',
                    }}
                >
                    Calculandia
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 28,
                        color: '#9ca3af',
                        maxWidth: 700,
                        textAlign: 'center',
                        lineHeight: 1.4,
                    }}
                >
                    Онлайн-калькуляторы для процентов, ипотеки, дробей, дат и уравнений
                </div>

                {/* Bottom accent */}
                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginTop: 48,
                    }}
                >
                    {['%', '🏠', '½', '📅', '∑'].map((emoji) => (
                        <div
                            key={emoji}
                            style={{
                                width: 56,
                                height: 56,
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 28,
                            }}
                        >
                            {emoji}
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size },
    );
}
