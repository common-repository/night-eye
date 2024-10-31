import Utilities from '../utilities/utilities';
import { S } from '../constants/constants';
var debug = false;

window.PLATFORM = 'chrome';

export default class WebGLProcessor {

    static processBackgroundCSSString(data, callback, hide_callback) {
        var start_index = 0;

        var css = data.value;
        for (; ;) {
            start_index = css.indexOf('url(', start_index);
            if (start_index === -1)
                break;

            start_index += 4;
            var string_symbol = css[start_index];
            if (string_symbol !== '"' && string_symbol !== '\'')
                string_symbol = '';
            else
                ++start_index;

            var end_index = css.indexOf(string_symbol + ')', start_index);
            if (end_index === -1)
                return;

            var url = css.substring(start_index, end_index);
            var replace_url = url;

            if (url.slice(0, 5) === 'blob:') {
                callback({
                    'css_text': null,
                    'property': data.property
                });
                continue;
            }

            if (url.slice(0, 10) !== 'data:image') {
                const question_mark_index = url.lastIndexOf('?');
                if (question_mark_index !== -1)
                    url = url.substring(0, question_mark_index);

                url = Utilities.makeURL(url, S.PAGE_PROTOCOL, S.PAGE_HOSTNAME, S.PAGE_PORT, S.PAGE_URL);

                const blob_url = this.images_cache.get(url);
                if (blob_url !== undefined) {
                    const result = blob_url !== null ? css.replace(replace_url, blob_url) : null;
                    callback({
                        'css_text': result,
                        'property': data.property
                    });
                    continue;
                }
            }

            hide_callback();
            WebGLProcessor.images_queue.push(new QueueStruct(css, url, replace_url, data.property, callback));
        }

        WebGLProcessor.signalImage();
    }

    static signalImage() {
        if (WebGLProcessor.images_queue.length === 0)
            return;
        if (WebGLProcessor.webgl_contexts_size < WebGLProcessor.WEBGL_MAX_CONTEXT_SIZE) {
            WebGLProcessor.webgl_free_contexts_queue.push(new NightEyeWebGLContext());
            ++WebGLProcessor.webgl_contexts_size;
        }
        if (WebGLProcessor.webgl_free_contexts_queue.length === 0)
            return;

        for (var queue_struct, i = WebGLProcessor.images_queue.length; i-- > 0;) {
            queue_struct = WebGLProcessor.images_queue[i];
            if (WebGLProcessor.images_processing.has(queue_struct.url) === false) {
                var webgl_context = WebGLProcessor.webgl_free_contexts_queue.pop();

                WebGLProcessor.images_queue.splice(i, 1);
                webgl_context.process(queue_struct);
                break;
            }
        }
    }
}

WebGLProcessor.images_queue = [];
WebGLProcessor.images_cache = new Map();
WebGLProcessor.webgl_contexts_size = 0;
WebGLProcessor.webgl_free_contexts_queue = [];
WebGLProcessor.images_processing = new Set();

WebGLProcessor.WEBGL_MAX_CONTEXT_SIZE = 12;
WebGLProcessor.AVERAGE_TEXTURE_SIZE = 1;
WebGLProcessor.URL_BLOB = (PLATFORM !== 'safari') && (PLATFORM !== 'firefox');
WebGLProcessor.EDGE = PLATFORM === 'edge';

//private
class QueueStruct {

    constructor(css_, url_, replace_url_, property_, callback_) {
        this.css = css_;
        this.url = url_;
        this.replace_url = replace_url_;
        this.property = property_;
        this.callback = callback_;
    }
}

class NightEyeWebGLContext {

    constructor() {
        this.canvas = null;

        this.avg_pixel = new Uint8Array(4);
        this.vertices = new Float32Array([
            -1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            1.0, 1.0, 0
        ]);
        this.textures = new Float32Array([
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0
        ]);
        this.indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

        this.gl = null;
        this.gl_flags = 0;
        this.gl_frame_buffer = 0;
        this.gl_texture_real = 0;
        this.gl_rendered_texture = 0;
        this.gl_depth_buffer = 0;

        this.state_struct = null;
        this.state_url = '';

        this.working_timer = null;

        this.onBlobReady = this.onBlobReady.bind(this);
    }

    init() {
        this.canvas = document.createElement('canvas');

        this.gl = this.canvas.getContext('webgl', {
            'antialias': true,
            'depth': false,
            'alpha': true,
            'preserveDrawingBuffer': true
        });
        this.gl.enable(this.gl.BLEND);
        this.gl.enable(this.gl.DITHER);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);

        const vert_shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vert_shader, fragment_shader);
        this.gl.compileShader(vert_shader);
        // if (!this.gl.getShaderParameter(vert_shader, this.gl.COMPILE_STATUS)) {
        //     var info = this.gl.getShaderInfoLog(vert_shader);
        //     throw new Error('Could not compile WebGL program. \n\n' + info);
        // }

        const frag_shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(frag_shader, pixel_shader);
        this.gl.compileShader(frag_shader);
        // if (!this.gl.getShaderParameter(frag_shader, this.gl.COMPILE_STATUS)) {
        //     let info = this.gl.getShaderInfoLog(frag_shader);
        //     throw new Error('Could not compile WebGL program. \n\n' + info);
        // }

        var shader_program = this.gl.createProgram();
        this.gl.attachShader(shader_program, vert_shader);
        this.gl.attachShader(shader_program, frag_shader);
        this.gl.linkProgram(shader_program);
        // if (!this.gl.getProgramParameter(shader_program, this.gl.LINK_STATUS)) {
        //     let info = this.gl.getProgramInfoLog(shader_program);
        //     throw new Error('Could not compile WebGL program. \n\n' + info);
        // }

        this.gl.useProgram(shader_program);

        const vertex_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);

        const coord = this.gl.getAttribLocation(shader_program, 'a_coordinates');
        this.gl.vertexAttribPointer(coord, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(coord);

        const tex_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, tex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textures, this.gl.STATIC_DRAW);

        const tex_coord = this.gl.getAttribLocation(shader_program, 'a_texcoord');
        this.gl.vertexAttribPointer(tex_coord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(tex_coord);

        // Create a texture.
        const textur_location = this.gl.getUniformLocation(shader_program, 'u_texture');
        this.gl.uniform1i(textur_location, 0);

        this.gl_texture_real = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_texture_real);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        this.gl_rendered_texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_rendered_texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

        this.gl_flags = this.gl.getUniformLocation(shader_program, 'u_flags');

        const index_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW);

        this.gl_frame_buffer = this.gl.createFramebuffer();
        this.gl_depth_buffer = this.gl.createRenderbuffer();

        if (WebGLProcessor.EDGE === true) {
            var small_canvas = document.createElement('canvas');
            small_canvas.setAttribute('width', WebGLProcessor.AVERAGE_TEXTURE_SIZE);
            small_canvas.setAttribute('height', WebGLProcessor.AVERAGE_TEXTURE_SIZE);

            this.small_canvas_ctx = small_canvas.getContext('2d');
        }
    }

    process(queue_struct) {
        WebGLProcessor.images_processing.add(queue_struct.url);

        this.state_struct = queue_struct;
        this.state_url = queue_struct.url;

        const blob_url = WebGLProcessor.images_cache.get(this.state_url);
        if (blob_url !== undefined) {
            this.finish(blob_url);
            return;
        }

        var headers = new Headers();
        var options = {
            method: 'GET',
            headers: headers,
            mode: 'cors', // this is the correct value, do not change it to : no-cors
            cache: 'default',
            credentials: 'include'
        };
        var request = new Request(this.state_url);


        //This function (FETCH) supports location redirect with header interception -  Image.src - not supported  header interception, when request is redirected
        fetch(request, options).then((response) => {
            response.arrayBuffer().then((buffer) => {
                var base64Flag = 'data:image/jpeg;base64,';
                var imageStr = this.arrayBufferToBase64(buffer);

                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onerror = this.onError.bind(this);
                img.onload = this.onLoad.bind(this, img);
                img.src = base64Flag + imageStr;

                if (debug === true)
                    console.log('request', this.state_url, WebGLProcessor.images_cache.get(this.state_url));
            });
        });
    }

    arrayBufferToBase64(buffer) {
        var binary = '';
        var bytes = [].slice.call(new Uint8Array(buffer));

        bytes.forEach((b) => binary += String.fromCharCode(b));

        return window.btoa(binary);
    }

    onError() {
        if (debug === true)
            console.log('on error', this.state_url);
        WebGLProcessor.images_cache.set(this.state_url, null);
        this.finish(null);
    }

    onLoad(img) {
        if (debug === true)
            console.log('on load', this.state_url);

        if (this.working_timer !== null)
            clearTimeout(this.working_timer);

        if (this.canvas === null)
            this.init();

        //make power of 2 texture
        var w = Math.min(512, NightEyeWebGLContext.gbp(img.width));
        var h = Math.min(512, NightEyeWebGLContext.gbp(img.height));
        var s = Math.min(w, h);

        //making power of 2 texture
        this.canvas.setAttribute('width', s);
        this.canvas.setAttribute('height', s);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.uniform3f(this.gl_flags, 1., 0., 0.);

        //rendered texture
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gl_frame_buffer);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_rendered_texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, s, s, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(512 * 512 * 4));
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.gl_rendered_texture, 0);

        //real texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_texture_real);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);

        //render depth buffer
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.gl_depth_buffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, s, s);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.gl_depth_buffer);

        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        //rendered texture ix upside-down, but.. we do not really care, because we are going to find average value, so orintation does not matter at att

        //render 1x1
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_rendered_texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.canvas.setAttribute('width', WebGLProcessor.AVERAGE_TEXTURE_SIZE);
        this.canvas.setAttribute('height', WebGLProcessor.AVERAGE_TEXTURE_SIZE);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);

        if (WebGLProcessor.EDGE === true) {
            var c_img = new Image();
            c_img.onload = () => {
                this.small_canvas_ctx.drawImage(c_img, 0, 0);
                this.avg_pixel = this.small_canvas_ctx.getImageData(0, 0, WebGLProcessor.AVERAGE_TEXTURE_SIZE, WebGLProcessor.AVERAGE_TEXTURE_SIZE).data;
                this.onAverageFound(img);
            };
            c_img.src = this.canvas.toDataURL();
        } else {
            this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.avg_pixel);
            this.onAverageFound(img);
        }
    }

    onAverageFound(img) {
        if (debug === true)
            console.log('average for', this.state_url, this.avg_pixel);

        if (this.avg_pixel[3] < 90) {
            WebGLProcessor.images_cache.set(this.state_url, null);
            this.finish(null);
        } else {
            this.canvas.setAttribute('width', img.width);
            this.canvas.setAttribute('height', img.height);
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_texture_real);

            const gray = Math.abs(this.avg_pixel[0] - this.avg_pixel[1]) < 2 && Math.abs(this.avg_pixel[0] - this.avg_pixel[2]) < 2 && Math.abs(this.avg_pixel[1] - this.avg_pixel[2]) < 2;
            const quite_light = this.avg_pixel[0] > 235 && this.avg_pixel[1] > 235 && this.avg_pixel[2] > 235;

            if (gray === false && quite_light === false) { //Dim
                const avg_pixel = (this.avg_pixel[0] + this.avg_pixel[1] + this.avg_pixel[2]) / 3;
                const dim = avg_pixel < 210 ? 0.8 : 0.0004074074 * avg_pixel * avg_pixel - 0.2040556 * avg_pixel + 25.63093;
                if (debug === true) {
                    console.log('total average', this.state_url, avg_pixel);
                    console.log('dim', this.state_url, 0.0004074074 * avg_pixel * avg_pixel - 0.2040556 * avg_pixel + 25.63093);
                }
                this.gl.uniform3f(this.gl_flags, 0., 0., dim);
            } else { //Convert
                this.gl.uniform3f(this.gl_flags, 0., 1., 0.);
            }

            this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);

            if (WebGLProcessor.URL_BLOB === true) {
                this.canvas.toBlob(this.onBlobReady);
            } else {
                this.onBase64URL();
            }
        }

        this.working_timer = setTimeout(this.cleanup.bind(this), 8000);
    }

    onBlobReady(blob) {
        const blob_url = URL.createObjectURL(blob);
        this.onResult(blob_url);
    }

    onBase64URL() {
        const base64 = this.canvas.toDataURL();
        this.onResult(base64);
    }

    onResult(blob_url) {
        if (debug === true)
            console.log('setting cache', this.state_url);
        WebGLProcessor.images_cache.set(this.state_url, blob_url);
        this.finish(blob_url);
    }

    finish(blob_url) {
        const result = blob_url !== null ? this.state_struct.css.replace(this.state_struct.replace_url, blob_url) : null;

        this.state_struct.callback({
            'css_text': result,
            'property': this.state_struct.property
        });
        WebGLProcessor.webgl_free_contexts_queue.push(this);
        WebGLProcessor.images_processing.delete(this.state_struct.url);
        WebGLProcessor.signalImage();
    }

    cleanup() {
        //remove only webgl conponnets which are initialized in init() but not the state once, because they could be used async
        if (this.canvas === null)
            return;

        this.gl.getExtension('WEBGL_lose_context').loseContext();

        this.canvas = null;

        this.gl = null;
        this.gl_flags = 0;
        this.gl_frame_buffer = 0;
        this.gl_texture_real = 0;
        this.gl_rendered_texture = 0;
        this.gl_depth_buffer = 0;
    }

}

NightEyeWebGLContext.gbp = (n) => {
    var m = n;
    m = m | m >> 1;
    m = m | m >> 2;
    m = m | m >> 4;
    m = m | m >> 8;
    m = m | m >> 16;
    m = m & ((~m >> 1) ^ 0x80000000);
    return m;
};

/* Edge only */
if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function (callback) {
            const base64 = this.toDataURL();
            const binary = atob(base64.substring(base64.indexOf(',') + 1));
            const size = binary.length;
            const buffer = new Uint8Array(size);

            for (var i = binary.length; i-- > 0;)
                buffer[i] = binary.charCodeAt(i);

            callback(new Blob([buffer]));
        }
    });
}

var fragment_shader = `
    attribute vec3 a_coordinates;
    attribute vec2 a_texcoord;

    varying vec2 v_texcoord;

    void main() {
        v_texcoord = a_texcoord;
        gl_Position = vec4(a_coordinates, 1.0);
    }
`;

var pixel_shader = `
    precision mediump float;

    uniform vec3 u_flags;
    uniform sampler2D u_texture;

    varying vec2 v_texcoord;

    vec3 rgb2hsl(vec3 color) {
        vec3 hsl; // init to 0 to avoid warnings ? (and reverse if + remove first part)

        float fmin = min(min(color.r, color.g), color.b); //Min. value of RGB
        float fmax = max(max(color.r, color.g), color.b); //Max. value of RGB
        float delta = fmax - fmin; //Delta RGB value

        hsl.z = (fmax + fmin) / 2.0; // Luminance

        if (delta == 0.0) //This is a gray, no chroma...
        {
            hsl.x = 0.0; // Hue
            hsl.y = 0.0; // Saturation
        } else //Chromatic data...
        {
            if (hsl.z < 0.5)
                hsl.y = delta / (fmax + fmin); // Saturation
            else
                hsl.y = delta / (2.0 - fmax - fmin); // Saturation

            float deltaR = (((fmax - color.r) / 6.0) + (delta / 2.0)) / delta;
            float deltaG = (((fmax - color.g) / 6.0) + (delta / 2.0)) / delta;
            float deltaB = (((fmax - color.b) / 6.0) + (delta / 2.0)) / delta;

            if (color.r == fmax)
                hsl.x = deltaB - deltaG; // Hue
            else if (color.g == fmax)
                hsl.x = (1.0 / 3.0) + deltaR - deltaB; // Hue
            else if (color.b == fmax)
                hsl.x = (2.0 / 3.0) + deltaG - deltaR; // Hue

            if (hsl.x < 0.0)
                hsl.x += 1.0; // Hue
            else if (hsl.x > 1.0)
                hsl.x -= 1.0; // Hue
        }

        return hsl;
    }


    float hue2rgb(float f1, float f2, float hue) {
        if (hue < 0.0)
            hue += 1.0;
        else if (hue > 1.0)
            hue -= 1.0;
        float res;
        if ((6.0 * hue) < 1.0)
            res = f1 + (f2 - f1) * 6.0 * hue;
        else if ((2.0 * hue) < 1.0)
            res = f2;
        else if ((3.0 * hue) < 2.0)
            res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
        else
            res = f1;
        return res;
    }

    vec3 hsl2rgb(vec3 hsl) {
        vec3 rgb;

        if (hsl.y == 0.0) {
            rgb = vec3(hsl.z); // Luminance
        } else {
            float f2;

            if (hsl.z < 0.5)
                f2 = hsl.z * (1.0 + hsl.y);
            else
                f2 = hsl.z + hsl.y - hsl.y * hsl.z;

            float f1 = 2.0 * hsl.z - f2;

            rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
            rgb.g = hue2rgb(f1, f2, hsl.x);
            rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
        }
        return rgb;
    }

    vec3 darken(vec3 hsl) {
        if (hsl.x > (30.0 / 360.0) && hsl.x < (90.0 / 360.0) && hsl.y > (40.0 / 100.0) && hsl.z < (70.0 / 100.0)) {
            hsl.x = (219.0 / 360.0);
            hsl.y = (63.0 / 100.0);
            hsl.z = (41.0 / 100.0);
        }

        if (hsl.y > (60.0 / 100.0)) {
            hsl.y = (60.0 / 100.0);
        }

        if (hsl.z > (60.0 / 100.0)) {
            hsl.z = 0.1 + (1.0 - hsl.z);
        }

        return hsl;
    }

    void main() {
        vec4 color_rgba = texture2D(u_texture, v_texcoord);
        vec3 color_hsl = rgb2hsl(color_rgba.xyz);
        vec3 color_rgb = hsl2rgb(darken(color_hsl));
        gl_FragColor = u_flags.y * vec4(color_rgb, color_rgba.w) + u_flags.x * color_rgba + vec4(u_flags.z, u_flags.z, u_flags.z, 1) * color_rgba;
    }
`;