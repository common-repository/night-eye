
export default class Cookies {

    static set(name, value) {
        var expire = new Date();
        expire.setFullYear(expire.getFullYear() + 10);
        document.cookie = name + '=' + value + "; expires=" + expire.toGMTString() + ";path=/";
    };

    static getValue(cookie_name) {
        var cookie, cookies = document.cookie.split(';');

        for (var i = cookies.length - 1; i >= 0; --i) {
            cookie = cookies[i].split('=');
            if (cookie[0].trim() === cookie_name)
                return cookie[1];
        }

        return null;
    };

    static delete(name) {
        var expire = new Date();
        expire.setFullYear(expire.getFullYear() - 10);
        document.cookie = name + "=1; expires=" + expire.toGMTString() + "; path=/";
    };
}


