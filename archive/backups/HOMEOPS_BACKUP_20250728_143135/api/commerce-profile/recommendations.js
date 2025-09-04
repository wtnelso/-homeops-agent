// Mock API endpoint for /api/commerce-profile/recommendations

export default function handler(req, res) {
  if (req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      recommendations: [
        {
          product: 'Smart Speaker',
          price_range: '$50-$100',
          description: 'A voice-controlled smart speaker for your home.',
          why_perfect: 'Great for hands-free help and music.'
        },
        {
          product: 'Robot Vacuum',
          price_range: '$150-$300',
          description: 'Automated vacuum cleaner for effortless cleaning.',
          why_perfect: 'Saves time and keeps your home tidy.'
        },
        {
          product: 'LED Light Strips',
          price_range: '$20-$40',
          description: 'Customizable lighting for any room.',
          why_perfect: 'Easy to install and adds ambiance.'
        }
      ]
    });
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
