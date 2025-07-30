// Force typography colors with JavaScript
// This ensures colors persist regardless of Tailwind compilation

function applyTypographyColors() {
    // Define our colors
    const colors = {
        paragraph: '#43526e',
        heading: '#14142b', 
        link: '#3e31fa'
    };

    // Apply paragraph colors
    document.querySelectorAll('p').forEach(el => {
        // Only apply if no specific text color class is present
        if (!el.className.includes('text-') && !el.style.color) {
            el.style.color = colors.paragraph;
            el.style.setProperty('color', colors.paragraph, 'important');
        }
    });

    // Apply heading colors
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
        if (!el.className.includes('text-') && !el.style.color) {
            el.style.color = colors.heading;
            el.style.setProperty('color', colors.heading, 'important');
        }
    });

    // Apply link colors
    document.querySelectorAll('a').forEach(el => {
        if (!el.className.includes('text-') && !el.style.color) {
            el.style.color = colors.link;
            el.style.setProperty('color', colors.link, 'important');
        }
    });

    console.log('✅ Typography colors applied successfully!');
}

// Apply colors when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTypographyColors);
} else {
    applyTypographyColors();
}

// Also apply after any route changes (for Astro navigation)
document.addEventListener('astro:page-load', applyTypographyColors);

// Apply after any dynamic content loads
setTimeout(applyTypographyColors, 100);
setTimeout(applyTypographyColors, 500);
setTimeout(applyTypographyColors, 1000);
