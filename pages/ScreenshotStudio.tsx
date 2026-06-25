import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

// Device definitions with dimensions
const DEVICES = [
    {
        name: 'Android Phone',
        width: 1080,
        height: 1920,
        type: 'phone'
    },
    {
        name: '7-inch Tablet',
        width: 1024,
        height: 600, // Landscape often preferred for tablets, or swap for portrait
        type: 'tablet'
    },
    {
        name: '10-inch Tablet',
        width: 1280,
        height: 800,
        type: 'tablet'
    },
    {
        name: 'Chromebook',
        width: 1366,
        height: 768,
        type: 'laptop'
    },
    {
        name: 'Feature Graphic',
        width: 1024,
        height: 500,
        type: 'laptop'
    }
];

const ScreenshotStudio: React.FC = () => {
    const [capturing, setCapturing] = useState<string | null>(null);

    const handleCapture = async (deviceName: string, iframeId: string) => {
        setCapturing(deviceName);
        const iframe = document.getElementById(iframeId) as HTMLIFrameElement;

        if (!iframe || !iframe.contentWindow || !iframe.contentDocument) {
            console.error('Iframe not found or inaccessible');
            setCapturing(null);
            return;
        }

        try {
            // We capture the body of the iframe
            const elementToCapture = iframe.contentDocument.body;

            // Need to ensure the iframe content is fully loaded
            const canvas = await html2canvas(elementToCapture, {
                useCORS: true, // Important if loading external images, though localhost should be fine
                width: iframe.width ? parseInt(iframe.width) : undefined,
                height: iframe.height ? parseInt(iframe.height) : undefined,
                windowWidth: iframe.width ? parseInt(iframe.width) : undefined,
                windowHeight: iframe.height ? parseInt(iframe.height) : undefined,
                scale: 1, // Capture at 1:1 of the defined dimension
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `mirhal-${deviceName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
            link.click();
        } catch (error) {
            console.error('Capture failed:', error);
            alert('Failed to capture screenshot. Check console for details.');
        } finally {
            setCapturing(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">📸 Mirhal Screenshot Studio</h1>
                <p className="text-gray-400">
                    Generate Google Play Store compliant screenshots.
                    Navigate within each frame to the desired screen, then click Capture.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-12">
                {DEVICES.map((device, index) => {
                    const iframeId = `frame-${index}`;
                    // Calculate a scale to fit it on screen somewhat nicely if it's huge
                    // (This is just for preview, html2canvas will capture full res)
                    const previewScale = 0.5;

                    return (
                        <div key={device.name} className="flex flex-col items-start space-y-4 border-b border-gray-700 pb-12">
                            <div className="flex items-center justify-between w-full max-w-4xl">
                                <div>
                                    <h2 className="text-2xl font-semibold text-brand-orange">{device.name}</h2>
                                    <p className="text-sm text-gray-400">{device.width} x {device.height} px</p>
                                </div>
                                <button
                                    onClick={() => handleCapture(device.name, iframeId)}
                                    disabled={!!capturing}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {capturing === device.name ? 'Capturing...' : 'Capture Screenshot'}
                                </button>
                            </div>

                            {/* 
                Wrapper to handle the visual scaling for preview purposes 
                We use transform scale to shrink it down so it fits on your screen,
                but the iframe itself remains at full "physical" pixel size.
              */}
                            <div
                                className="relative overflow-hidden bg-white rounded-md border-4 border-gray-800 shadow-2xl origin-top-left"
                                style={{
                                    width: `${device.width}px`,
                                    height: `${device.height}px`,
                                    transform: `scale(${device.width > 1200 ? 0.4 : 0.6})`, // Zoom out to see headers
                                    marginBottom: `-${device.height * (device.width > 1200 ? 0.6 : 0.4)}px` // Negative margin to compensate for scale
                                }}
                            >
                                <iframe
                                    id={iframeId}
                                    src="/"
                                    width={device.width}
                                    height={device.height}
                                    className="w-full h-full border-0"
                                    title={`Preview for ${device.name}`}
                                    style={{ backgroundColor: '#ffffff' }}
                                />
                            </div>

                            {/* Spacer to push next item down after the negative margin hack */}
                            <div style={{ height: `${device.height * (device.width > 1200 ? 0.4 : 0.6) + 50}px` }}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScreenshotStudio;
