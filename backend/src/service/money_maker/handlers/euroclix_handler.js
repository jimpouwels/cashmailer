import Handler from "./handler.js";

export default class EuroClixHandler extends Handler {

    constructor(name) {
        super(name);
    }

    matchUrl(url) {
        return url.host.includes('euroclix.nl') && url.path.includes('reference');
    }

    async performCustomAction(_page, _url, _browser) {
    }
    
    hasRedirected(url) {
        return super.hasRedirected(url) && (!url.host.includes('euroclix.nl') || url.path.includes('utm_campaign'));
    }

    filter(_mail) {
        return false;
    }

}