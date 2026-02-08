export function deviceType(){
    // Get the User-Agent string from the browser
    const userAgent = window.navigator.userAgent;

    // Define keywords commonly found in mobile User-Agent strings
    const mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone'];

    // Check if the User-Agent contains any of the mobile keywords
    const isMobile = mobileKeywords.some((keyword) => userAgent.includes(keyword));

    return isMobile ? 'mobile' : 'desktop';
}