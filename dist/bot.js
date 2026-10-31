"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/gifenc/dist/gifenc.js
var require_gifenc = __commonJS({
  "node_modules/gifenc/dist/gifenc.js"(exports2) {
    var __defProp2 = Object.defineProperty;
    var __markAsModule = (target) => __defProp2(target, "__esModule", { value: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    __markAsModule(exports2);
    __export2(exports2, {
      GIFEncoder: () => GIFEncoder3,
      applyPalette: () => applyPalette3,
      default: () => src_default,
      nearestColor: () => nearestColor,
      nearestColorIndex: () => nearestColorIndex,
      nearestColorIndexWithDistance: () => nearestColorIndexWithDistance,
      prequantize: () => prequantize,
      quantize: () => quantize3,
      snapColorsToPalette: () => snapColorsToPalette
    });
    var constants_default = {
      signature: "GIF",
      version: "89a",
      trailer: 59,
      extensionIntroducer: 33,
      applicationExtensionLabel: 255,
      graphicControlExtensionLabel: 249,
      imageSeparator: 44,
      signatureSize: 3,
      versionSize: 3,
      globalColorTableFlagMask: 128,
      colorResolutionMask: 112,
      sortFlagMask: 8,
      globalColorTableSizeMask: 7,
      applicationIdentifierSize: 8,
      applicationAuthCodeSize: 3,
      disposalMethodMask: 28,
      userInputFlagMask: 2,
      transparentColorFlagMask: 1,
      localColorTableFlagMask: 128,
      interlaceFlagMask: 64,
      idSortFlagMask: 32,
      localColorTableSizeMask: 7
    };
    function createStream(initialCapacity = 256) {
      let cursor = 0;
      let contents = new Uint8Array(initialCapacity);
      return {
        get buffer() {
          return contents.buffer;
        },
        reset() {
          cursor = 0;
        },
        bytesView() {
          return contents.subarray(0, cursor);
        },
        bytes() {
          return contents.slice(0, cursor);
        },
        writeByte(byte) {
          expand(cursor + 1);
          contents[cursor] = byte;
          cursor++;
        },
        writeBytes(data, offset = 0, byteLength = data.length) {
          expand(cursor + byteLength);
          for (let i = 0; i < byteLength; i++) {
            contents[cursor++] = data[i + offset];
          }
        },
        writeBytesView(data, offset = 0, byteLength = data.byteLength) {
          expand(cursor + byteLength);
          contents.set(data.subarray(offset, offset + byteLength), cursor);
          cursor += byteLength;
        }
      };
      function expand(newCapacity) {
        var prevCapacity = contents.length;
        if (prevCapacity >= newCapacity)
          return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0)
          newCapacity = Math.max(newCapacity, 256);
        const oldContents = contents;
        contents = new Uint8Array(newCapacity);
        if (cursor > 0)
          contents.set(oldContents.subarray(0, cursor), 0);
      }
    }
    var BITS = 12;
    var DEFAULT_HSIZE = 5003;
    var MASKS = [
      0,
      1,
      3,
      7,
      15,
      31,
      63,
      127,
      255,
      511,
      1023,
      2047,
      4095,
      8191,
      16383,
      32767,
      65535
    ];
    function lzwEncode(width, height, pixels, colorDepth, outStream = createStream(512), accum = new Uint8Array(256), htab = new Int32Array(DEFAULT_HSIZE), codetab = new Int32Array(DEFAULT_HSIZE)) {
      const hsize = htab.length;
      const initCodeSize = Math.max(2, colorDepth);
      accum.fill(0);
      codetab.fill(0);
      htab.fill(-1);
      let cur_accum = 0;
      let cur_bits = 0;
      const init_bits = initCodeSize + 1;
      const g_init_bits = init_bits;
      let clear_flg = false;
      let n_bits = g_init_bits;
      let maxcode = (1 << n_bits) - 1;
      const ClearCode = 1 << init_bits - 1;
      const EOFCode = ClearCode + 1;
      let free_ent = ClearCode + 2;
      let a_count = 0;
      let ent = pixels[0];
      let hshift = 0;
      for (let fcode = hsize; fcode < 65536; fcode *= 2) {
        ++hshift;
      }
      hshift = 8 - hshift;
      outStream.writeByte(initCodeSize);
      output(ClearCode);
      const length = pixels.length;
      for (let idx = 1; idx < length; idx++) {
        next_block: {
          const c = pixels[idx];
          const fcode = (c << BITS) + ent;
          let i = c << hshift ^ ent;
          if (htab[i] === fcode) {
            ent = codetab[i];
            break next_block;
          }
          const disp = i === 0 ? 1 : hsize - i;
          while (htab[i] >= 0) {
            i -= disp;
            if (i < 0)
              i += hsize;
            if (htab[i] === fcode) {
              ent = codetab[i];
              break next_block;
            }
          }
          output(ent);
          ent = c;
          if (free_ent < 1 << BITS) {
            codetab[i] = free_ent++;
            htab[i] = fcode;
          } else {
            htab.fill(-1);
            free_ent = ClearCode + 2;
            clear_flg = true;
            output(ClearCode);
          }
        }
      }
      output(ent);
      output(EOFCode);
      outStream.writeByte(0);
      return outStream.bytesView();
      function output(code) {
        cur_accum &= MASKS[cur_bits];
        if (cur_bits > 0)
          cur_accum |= code << cur_bits;
        else
          cur_accum = code;
        cur_bits += n_bits;
        while (cur_bits >= 8) {
          accum[a_count++] = cur_accum & 255;
          if (a_count >= 254) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
          cur_accum >>= 8;
          cur_bits -= 8;
        }
        if (free_ent > maxcode || clear_flg) {
          if (clear_flg) {
            n_bits = g_init_bits;
            maxcode = (1 << n_bits) - 1;
            clear_flg = false;
          } else {
            ++n_bits;
            maxcode = n_bits === BITS ? 1 << n_bits : (1 << n_bits) - 1;
          }
        }
        if (code == EOFCode) {
          while (cur_bits > 0) {
            accum[a_count++] = cur_accum & 255;
            if (a_count >= 254) {
              outStream.writeByte(a_count);
              outStream.writeBytesView(accum, 0, a_count);
              a_count = 0;
            }
            cur_accum >>= 8;
            cur_bits -= 8;
          }
          if (a_count > 0) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
        }
      }
    }
    var lzwEncode_default = lzwEncode;
    function rgb888_to_rgb565(r, g, b) {
      return r << 8 & 63488 | g << 2 & 992 | b >> 3;
    }
    function rgba8888_to_rgba4444(r, g, b, a) {
      return r >> 4 | g & 240 | (b & 240) << 4 | (a & 240) << 8;
    }
    function rgb888_to_rgb444(r, g, b) {
      return r >> 4 << 8 | g & 240 | b >> 4;
    }
    function clamp(value, min, max) {
      return value < min ? min : value > max ? max : value;
    }
    function sqr(value) {
      return value * value;
    }
    function find_nn(bins, idx, hasAlpha) {
      var nn = 0;
      var err = 1e100;
      const bin1 = bins[idx];
      const n1 = bin1.cnt;
      const wa = bin1.ac;
      const wr = bin1.rc;
      const wg = bin1.gc;
      const wb = bin1.bc;
      for (var i = bin1.fw; i != 0; i = bins[i].fw) {
        const bin = bins[i];
        const n2 = bin.cnt;
        const nerr2 = n1 * n2 / (n1 + n2);
        if (nerr2 >= err)
          continue;
        var nerr = 0;
        if (hasAlpha) {
          nerr += nerr2 * sqr(bin.ac - wa);
          if (nerr >= err)
            continue;
        }
        nerr += nerr2 * sqr(bin.rc - wr);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.gc - wg);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.bc - wb);
        if (nerr >= err)
          continue;
        err = nerr;
        nn = i;
      }
      bin1.err = err;
      bin1.nn = nn;
    }
    function create_bin() {
      return {
        ac: 0,
        rc: 0,
        gc: 0,
        bc: 0,
        cnt: 0,
        nn: 0,
        fw: 0,
        bk: 0,
        tm: 0,
        mtm: 0,
        err: 0
      };
    }
    function create_bin_list(data, format) {
      const bincount = format === "rgb444" ? 4096 : 65536;
      const bins = new Array(bincount);
      const size = data.length;
      if (format === "rgba4444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgba8888_to_rgba4444(r, g, b, a);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.ac += a;
          bin.cnt++;
        }
      } else if (format === "rgb444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb444(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      } else {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb565(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      }
      return bins;
    }
    function quantize3(rgba, maxColors, opts = {}) {
      const {
        format = "rgb565",
        clearAlpha = true,
        clearAlphaColor = 0,
        clearAlphaThreshold = 0,
        oneBitAlpha = false
      } = opts;
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      const data = new Uint32Array(rgba.buffer);
      let useSqrt = opts.useSqrt !== false;
      const hasAlpha = format === "rgba4444";
      const bins = create_bin_list(data, format);
      const bincount = bins.length;
      const bincountMinusOne = bincount - 1;
      const heap = new Uint32Array(bincount + 1);
      var maxbins = 0;
      for (var i = 0; i < bincount; ++i) {
        const bin = bins[i];
        if (bin != null) {
          var d = 1 / bin.cnt;
          if (hasAlpha)
            bin.ac *= d;
          bin.rc *= d;
          bin.gc *= d;
          bin.bc *= d;
          bins[maxbins++] = bin;
        }
      }
      if (sqr(maxColors) / maxbins < 0.022) {
        useSqrt = false;
      }
      var i = 0;
      for (; i < maxbins - 1; ++i) {
        bins[i].fw = i + 1;
        bins[i + 1].bk = i;
        if (useSqrt)
          bins[i].cnt = Math.sqrt(bins[i].cnt);
      }
      if (useSqrt)
        bins[i].cnt = Math.sqrt(bins[i].cnt);
      var h, l, l2;
      for (i = 0; i < maxbins; ++i) {
        find_nn(bins, i, false);
        var err = bins[i].err;
        for (l = ++heap[0]; l > 1; l = l2) {
          l2 = l >> 1;
          if (bins[h = heap[l2]].err <= err)
            break;
          heap[l] = h;
        }
        heap[l] = i;
      }
      var extbins = maxbins - maxColors;
      for (i = 0; i < extbins; ) {
        var tb;
        for (; ; ) {
          var b1 = heap[1];
          tb = bins[b1];
          if (tb.tm >= tb.mtm && bins[tb.nn].mtm <= tb.tm)
            break;
          if (tb.mtm == bincountMinusOne)
            b1 = heap[1] = heap[heap[0]--];
          else {
            find_nn(bins, b1, false);
            tb.tm = i;
          }
          var err = bins[b1].err;
          for (l = 1; (l2 = l + l) <= heap[0]; l = l2) {
            if (l2 < heap[0] && bins[heap[l2]].err > bins[heap[l2 + 1]].err)
              l2++;
            if (err <= bins[h = heap[l2]].err)
              break;
            heap[l] = h;
          }
          heap[l] = b1;
        }
        var nb = bins[tb.nn];
        var n1 = tb.cnt;
        var n2 = nb.cnt;
        var d = 1 / (n1 + n2);
        if (hasAlpha)
          tb.ac = d * (n1 * tb.ac + n2 * nb.ac);
        tb.rc = d * (n1 * tb.rc + n2 * nb.rc);
        tb.gc = d * (n1 * tb.gc + n2 * nb.gc);
        tb.bc = d * (n1 * tb.bc + n2 * nb.bc);
        tb.cnt += nb.cnt;
        tb.mtm = ++i;
        bins[nb.bk].fw = nb.fw;
        bins[nb.fw].bk = nb.bk;
        nb.mtm = bincountMinusOne;
      }
      let palette = [];
      var k = 0;
      for (i = 0; ; ++k) {
        let r = clamp(Math.round(bins[i].rc), 0, 255);
        let g = clamp(Math.round(bins[i].gc), 0, 255);
        let b = clamp(Math.round(bins[i].bc), 0, 255);
        let a = 255;
        if (hasAlpha) {
          a = clamp(Math.round(bins[i].ac), 0, 255);
          if (oneBitAlpha) {
            const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
            a = a <= threshold ? 0 : 255;
          }
          if (clearAlpha && a <= clearAlphaThreshold) {
            r = g = b = clearAlphaColor;
            a = 0;
          }
        }
        const color = hasAlpha ? [r, g, b, a] : [r, g, b];
        const exists = existsInPalette(palette, color);
        if (!exists)
          palette.push(color);
        if ((i = bins[i].fw) == 0)
          break;
      }
      return palette;
    }
    function existsInPalette(palette, color) {
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        let matchesRGB = p[0] === color[0] && p[1] === color[1] && p[2] === color[2];
        let matchesAlpha = p.length >= 4 && color.length >= 4 ? p[3] === color[3] : true;
        if (matchesRGB && matchesAlpha)
          return true;
      }
      return false;
    }
    function euclideanDistanceSquared(a, b) {
      var sum = 0;
      var n;
      for (n = 0; n < a.length; n++) {
        const dx = a[n] - b[n];
        sum += dx * dx;
      }
      return sum;
    }
    function roundStep(byte, step) {
      return step > 1 ? Math.round(byte / step) * step : byte;
    }
    function prequantize(rgba, { roundRGB = 5, roundAlpha = 10, oneBitAlpha = null } = {}) {
      const data = new Uint32Array(rgba.buffer);
      for (let i = 0; i < data.length; i++) {
        const color = data[i];
        let a = color >> 24 & 255;
        let b = color >> 16 & 255;
        let g = color >> 8 & 255;
        let r = color & 255;
        a = roundStep(a, roundAlpha);
        if (oneBitAlpha) {
          const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
          a = a <= threshold ? 0 : 255;
        }
        r = roundStep(r, roundRGB);
        g = roundStep(g, roundRGB);
        b = roundStep(b, roundRGB);
        data[i] = a << 24 | b << 16 | g << 8 | r << 0;
      }
    }
    function applyPalette3(rgba, palette, format = "rgb565") {
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (palette.length > 256) {
        throw new Error("applyPalette() only works with 256 colors or less");
      }
      const data = new Uint32Array(rgba.buffer);
      const length = data.length;
      const bincount = format === "rgb444" ? 4096 : 65536;
      const index = new Uint8Array(length);
      const cache = new Array(bincount);
      const hasAlpha = format === "rgba4444";
      if (format === "rgba4444") {
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgba8888_to_rgba4444(r, g, b, a);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGBA(r, g, b, a, palette);
          index[i] = idx;
        }
      } else {
        const rgb888_to_key = format === "rgb444" ? rgb888_to_rgb444 : rgb888_to_rgb565;
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgb888_to_key(r, g, b);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGB(r, g, b, palette);
          index[i] = idx;
        }
      }
      return index;
    }
    function nearestColorIndexRGBA(r, g, b, a, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const a2 = px2[3];
        let curdist = sqr2(a2 - a);
        if (curdist > mindist)
          continue;
        const r2 = px2[0];
        curdist += sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function nearestColorIndexRGB(r, g, b, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const r2 = px2[0];
        let curdist = sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function snapColorsToPalette(palette, knownColors, threshold = 5) {
      if (!palette.length || !knownColors.length)
        return;
      const paletteRGB = palette.map((p) => p.slice(0, 3));
      const thresholdSq = threshold * threshold;
      const dim = palette[0].length;
      for (let i = 0; i < knownColors.length; i++) {
        let color = knownColors[i];
        if (color.length < dim) {
          color = [color[0], color[1], color[2], 255];
        } else if (color.length > dim) {
          color = color.slice(0, 3);
        } else {
          color = color.slice();
        }
        const r = nearestColorIndexWithDistance(paletteRGB, color.slice(0, 3), euclideanDistanceSquared);
        const idx = r[0];
        const distanceSq = r[1];
        if (distanceSq > 0 && distanceSq <= thresholdSq) {
          palette[idx] = color;
        }
      }
    }
    function sqr2(a) {
      return a * a;
    }
    function nearestColorIndex(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return minDistIndex;
    }
    function nearestColorIndexWithDistance(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return [minDistIndex, minDist];
    }
    function nearestColor(colors, pixel, distanceFn = euclideanDistanceSquared) {
      return colors[nearestColorIndex(colors, pixel, distanceFn)];
    }
    function GIFEncoder3(opt = {}) {
      const { initialCapacity = 4096, auto = true } = opt;
      const stream = createStream(initialCapacity);
      const HSIZE = 5003;
      const accum = new Uint8Array(256);
      const htab = new Int32Array(HSIZE);
      const codetab = new Int32Array(HSIZE);
      let hasInit = false;
      return {
        reset() {
          stream.reset();
          hasInit = false;
        },
        finish() {
          stream.writeByte(constants_default.trailer);
        },
        bytes() {
          return stream.bytes();
        },
        bytesView() {
          return stream.bytesView();
        },
        get buffer() {
          return stream.buffer;
        },
        get stream() {
          return stream;
        },
        writeHeader,
        writeFrame(index, width, height, opts = {}) {
          const {
            transparent = false,
            transparentIndex = 0,
            delay = 0,
            palette = null,
            repeat = 0,
            colorDepth = 8,
            dispose = -1
          } = opts;
          let first = false;
          if (auto) {
            if (!hasInit) {
              first = true;
              writeHeader();
              hasInit = true;
            }
          } else {
            first = Boolean(opts.first);
          }
          width = Math.max(0, Math.floor(width));
          height = Math.max(0, Math.floor(height));
          if (first) {
            if (!palette) {
              throw new Error("First frame must include a { palette } option");
            }
            encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth);
            encodeColorTable(stream, palette);
            if (repeat >= 0) {
              encodeNetscapeExt(stream, repeat);
            }
          }
          const delayTime = Math.round(delay / 10);
          encodeGraphicControlExt(stream, dispose, delayTime, transparent, transparentIndex);
          const useLocalColorTable = Boolean(palette) && !first;
          encodeImageDescriptor(stream, width, height, useLocalColorTable ? palette : null);
          if (useLocalColorTable)
            encodeColorTable(stream, palette);
          encodePixels(stream, index, width, height, colorDepth, accum, htab, codetab);
        }
      };
      function writeHeader() {
        writeUTFBytes(stream, "GIF89a");
      }
    }
    function encodeGraphicControlExt(stream, dispose, delay, transparent, transparentIndex) {
      stream.writeByte(33);
      stream.writeByte(249);
      stream.writeByte(4);
      if (transparentIndex < 0) {
        transparentIndex = 0;
        transparent = false;
      }
      var transp, disp;
      if (!transparent) {
        transp = 0;
        disp = 0;
      } else {
        transp = 1;
        disp = 2;
      }
      if (dispose >= 0) {
        disp = dispose & 7;
      }
      disp <<= 2;
      const userInput = 0;
      stream.writeByte(0 | disp | userInput | transp);
      writeUInt16(stream, delay);
      stream.writeByte(transparentIndex || 0);
      stream.writeByte(0);
    }
    function encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth = 8) {
      const globalColorTableFlag = 1;
      const sortFlag = 0;
      const globalColorTableSize = colorTableSize(palette.length) - 1;
      const fields = globalColorTableFlag << 7 | colorDepth - 1 << 4 | sortFlag << 3 | globalColorTableSize;
      const backgroundColorIndex = 0;
      const pixelAspectRatio = 0;
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      stream.writeBytes([fields, backgroundColorIndex, pixelAspectRatio]);
    }
    function encodeNetscapeExt(stream, repeat) {
      stream.writeByte(33);
      stream.writeByte(255);
      stream.writeByte(11);
      writeUTFBytes(stream, "NETSCAPE2.0");
      stream.writeByte(3);
      stream.writeByte(1);
      writeUInt16(stream, repeat);
      stream.writeByte(0);
    }
    function encodeColorTable(stream, palette) {
      const colorTableLength = 1 << colorTableSize(palette.length);
      for (let i = 0; i < colorTableLength; i++) {
        let color = [0, 0, 0];
        if (i < palette.length) {
          color = palette[i];
        }
        stream.writeByte(color[0]);
        stream.writeByte(color[1]);
        stream.writeByte(color[2]);
      }
    }
    function encodeImageDescriptor(stream, width, height, localPalette) {
      stream.writeByte(44);
      writeUInt16(stream, 0);
      writeUInt16(stream, 0);
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      if (localPalette) {
        const interlace = 0;
        const sorted = 0;
        const palSize = colorTableSize(localPalette.length) - 1;
        stream.writeByte(128 | interlace | sorted | 0 | palSize);
      } else {
        stream.writeByte(0);
      }
    }
    function encodePixels(stream, index, width, height, colorDepth = 8, accum, htab, codetab) {
      lzwEncode_default(width, height, index, colorDepth, stream, accum, htab, codetab);
    }
    function writeUInt16(stream, short) {
      stream.writeByte(short & 255);
      stream.writeByte(short >> 8 & 255);
    }
    function writeUTFBytes(stream, text) {
      for (var i = 0; i < text.length; i++) {
        stream.writeByte(text.charCodeAt(i));
      }
    }
    function colorTableSize(length) {
      return Math.max(Math.ceil(Math.log2(length)), 1);
    }
    var src_default = GIFEncoder3;
  }
});

// src/bot/index.ts
var index_exports = {};
__export(index_exports, {
  SLASH_COMMANDS_DATA: () => SLASH_COMMANDS_DATA,
  startBot: () => startBot
});
module.exports = __toCommonJS(index_exports);
var import_dotenv = __toESM(require("dotenv"));

// src/bot/client.ts
var import_discord = require("discord.js");
function createBotClient() {
  return new import_discord.Client({
    intents: [
      import_discord.GatewayIntentBits.Guilds,
      import_discord.GatewayIntentBits.GuildMessages,
      import_discord.GatewayIntentBits.MessageContent,
      import_discord.GatewayIntentBits.GuildMessageReactions,
      import_discord.GatewayIntentBits.GuildMembers
    ],
    partials: [
      import_discord.Partials.Message,
      import_discord.Partials.Channel,
      import_discord.Partials.Reaction,
      import_discord.Partials.User,
      import_discord.Partials.GuildMember
    ]
  });
}

// src/bot/events/ready.ts
var import_discord3 = require("discord.js");

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = global.prisma || new import_client.PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
});
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// src/bot/commands/index.ts
var import_discord2 = require("discord.js");

// src/bot/services/imageGenerator.ts
var import_canvas = require("@napi-rs/canvas");
var gifencModule = __toESM(require_gifenc());
var GIFEncoder2 = gifencModule.GIFEncoder || gifencModule.default;
var quantize2 = gifencModule.quantize;
var applyPalette2 = gifencModule.applyPalette;
function validateImageUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, reason: "Only HTTP and HTTPS image URLs are supported." };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1" || hostname === "169.254.169.254" || // AWS/GCP/Azure instance metadata
    hostname.endsWith(".internal") || hostname.endsWith(".local") || hostname.endsWith(".onion")) {
      return { valid: false, reason: "Access to private or local network addresses is prohibited." };
    }
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const first = parseInt(ipMatch[1], 10);
      const second = parseInt(ipMatch[2], 10);
      if (first === 10 || first === 127 || first === 172 && second >= 16 && second <= 31 || first === 192 && second === 168 || first === 169 && second === 254) {
        return { valid: false, reason: "Private network IP addresses are not permitted." };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }
}
async function fetchSafeImageBuffer(urlStr, maxSizeBytes = 8 * 1024 * 1024) {
  const check = validateImageUrl(urlStr);
  if (!check.valid) {
    throw new Error(check.reason || "Invalid or untrusted image URL.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1e4);
  try {
    const res = await fetch(urlStr, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AuraTamil-Bot/1.0 (+https://discord.gg)",
        Accept: "image/png,image/jpeg,image/webp,image/gif,*/*"
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to download image (HTTP ${res.status}: ${res.statusText}).`);
    }
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error(`URL did not return an image (Content-Type: ${contentType || "unknown"}).`);
    }
    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    if (contentLength > maxSizeBytes) {
      throw new Error(`Image size exceeds the 8 MB maximum limit.`);
    }
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (buffer.length > maxSizeBytes) {
      throw new Error(`Image size exceeds the 8 MB maximum limit.`);
    }
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}
async function makeImageIntoGif(imageBuffer, style = "pulse") {
  const img = await (0, import_canvas.loadImage)(imageBuffer);
  const targetMax = 380;
  let targetWidth = img.width;
  let targetHeight = img.height;
  if (targetWidth > targetMax || targetHeight > targetMax) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round(targetHeight / targetWidth * targetMax);
      targetWidth = targetMax;
    } else {
      targetWidth = Math.round(targetWidth / targetHeight * targetMax);
      targetHeight = targetMax;
    }
  }
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;
  const frameCount = 12;
  const frameDelay = 85;
  const gif = GIFEncoder2();
  const canvas = (0, import_canvas.createCanvas)(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < frameCount; i++) {
    const progress = i / frameCount;
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.fillStyle = "#0c0a14";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    if (style === "zoom") {
      const scale = 1 + Math.sin(progress * Math.PI) * 0.08;
      const w = targetWidth * scale;
      const h = targetHeight * scale;
      const x = (targetWidth - w) / 2;
      const y = (targetHeight - h) / 2;
      ctx.save();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
      const grad = ctx.createRadialGradient(
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.35,
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.55
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(124, 58, 237, 0.45)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (style === "glow" || style === "pulse") {
      const glowIntensity = Math.sin(progress * Math.PI * 2);
      const blur = 10 + Math.abs(glowIntensity) * 14;
      const glowColor = glowIntensity > 0 ? "rgba(147, 51, 234, 0.75)" : "rgba(239, 68, 68, 0.75)";
      const pad = 8;
      ctx.drawImage(img, pad, pad, targetWidth - pad * 2, targetHeight - pad * 2);
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = blur;
      ctx.strokeRect(pad, pad, targetWidth - pad * 2, targetHeight - pad * 2);
      ctx.restore();
    } else if (style === "scanline") {
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const scanY = Math.floor(progress * targetHeight);
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
      scanGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.55)");
      scanGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, targetWidth, 40);
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let y = 0; y < targetHeight; y += 4) {
        ctx.fillRect(0, y, targetWidth, 1);
      }
    }
    const { data } = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const palette = quantize2(data, 256);
    const index = applyPalette2(data, palette);
    gif.writeFrame(index, targetWidth, targetHeight, { palette, delay: frameDelay });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}
async function generateQuoteCard(options) {
  const width = 1024;
  const height = 537;
  const canvas = (0, import_canvas.createCanvas)(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  let avatarImg = null;
  let avBuffer = options.avatarBuffer;
  if (!avBuffer && options.avatarUrl) {
    try {
      avBuffer = await fetchSafeImageBuffer(options.avatarUrl);
    } catch {
    }
  }
  if (avBuffer) {
    try {
      avatarImg = await (0, import_canvas.loadImage)(avBuffer);
    } catch {
      avatarImg = null;
    }
  }
  let textCenterX = width / 2;
  let maxTextWidth = 580;
  if (avatarImg) {
    const scale = height / avatarImg.height;
    const avWidth = Math.round(avatarImg.width * scale);
    ctx.drawImage(avatarImg, 0, 0, avWidth, height);
    const fadeStart = Math.min(200, avWidth * 0.42);
    const fadeEnd = Math.min(480, Math.max(avWidth, 380));
    const grad = ctx.createLinearGradient(fadeStart, 0, fadeEnd, 0);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(0.3, "rgba(0, 0, 0, 0.4)");
    grad.addColorStop(0.65, "rgba(0, 0, 0, 0.82)");
    grad.addColorStop(0.9, "rgba(0, 0, 0, 0.98)");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.fillRect(fadeStart, 0, width - fadeStart, height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(fadeEnd, 0, width - fadeEnd, height);
    const topVignette = ctx.createLinearGradient(0, 0, 0, 50);
    topVignette.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    topVignette.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = topVignette;
    ctx.fillRect(0, 0, fadeEnd, 50);
    const botVignette = ctx.createLinearGradient(0, height - 50, 0, height);
    botVignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    botVignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = botVignette;
    ctx.fillRect(0, height - 50, fadeEnd, 50);
    textCenterX = (fadeEnd + width) / 2;
    maxTextWidth = Math.min(520, width - fadeEnd - 50);
  }
  const cleanText = options.text.trim();
  let fontSize = 42;
  if (cleanText.length > 250) fontSize = 22;
  else if (cleanText.length > 140) fontSize = 26;
  else if (cleanText.length > 80) fontSize = 32;
  else if (cleanText.length > 35) fontSize = 38;
  ctx.font = `italic ${fontSize}px "Segoe Script", "Lucida Handwriting", "Brush Script MT", Georgia, cursive, serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  const lineHeight = fontSize * 1.4;
  const lines = wrapText(ctx, cleanText, maxTextWidth);
  const totalTextHeight = lines.length * lineHeight;
  const authorBlockHeight = 38;
  const startY = Math.max(80, (height - (totalTextHeight + authorBlockHeight)) / 2 + fontSize * 0.8);
  lines.forEach((line, index) => {
    ctx.fillText(line, textCenterX, startY + index * lineHeight);
  });
  const mentionHandle = options.authorTag?.replace(/^@+/, "").trim();
  let rawAuthor = options.author?.replace(/<@!?\d+>/g, "").replace(/^@+/, "").trim() || "";
  let displayAuthor = "";
  if (mentionHandle) {
    displayAuthor = `@${mentionHandle}`;
  } else if (rawAuthor) {
    const normalized = rawAuthor.normalize("NFKD").trim();
    displayAuthor = `@${normalized}`;
  } else {
    displayAuthor = "@Anonymous";
  }
  const authorY = startY + (lines.length - 1) * lineHeight + 48;
  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#E5E7EB";
  ctx.fillText(`- ${displayAuthor}`, textCenterX, authorY);
  let watermarkText = (options.serverName || "A U R A   T A M I L").normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim();
  if (!watermarkText) watermarkText = "A U R A   T A M I L";
  ctx.textAlign = "right";
  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#555555";
  ctx.fillText(watermarkText, width - 25, height - 25);
  return canvas.toBuffer("image/png");
}
async function generateAnimatedQuoteCard(options) {
  const width = 800;
  const height = 420;
  const frameCount = 10;
  const frameDelay = 100;
  const canvas = (0, import_canvas.createCanvas)(width, height);
  const ctx = canvas.getContext("2d");
  const gif = GIFEncoder2();
  let avatarImg = null;
  let avBuffer = options.avatarBuffer;
  if (!avBuffer && options.avatarUrl) {
    try {
      avBuffer = await fetchSafeImageBuffer(options.avatarUrl);
    } catch {
    }
  }
  if (avBuffer) {
    try {
      avatarImg = await (0, import_canvas.loadImage)(avBuffer);
    } catch {
      avatarImg = null;
    }
  }
  let textCenterX = width / 2;
  let maxTextWidth = 460;
  let fadeEnd = 360;
  for (let f = 0; f < frameCount; f++) {
    const progress = f / frameCount;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    if (avatarImg) {
      const scale = height / avatarImg.height;
      const avWidth = Math.round(avatarImg.width * scale);
      ctx.drawImage(avatarImg, 0, 0, avWidth, height);
      const fadeStart = Math.min(150, avWidth * 0.42);
      fadeEnd = Math.min(380, Math.max(avWidth, 300));
      const grad = ctx.createLinearGradient(fadeStart, 0, fadeEnd, 0);
      grad.addColorStop(0, "rgba(0, 0, 0, 0)");
      grad.addColorStop(0.35, "rgba(0, 0, 0, 0.45)");
      grad.addColorStop(0.7, "rgba(0, 0, 0, 0.85)");
      grad.addColorStop(1, "#000000");
      ctx.fillStyle = grad;
      ctx.fillRect(fadeStart, 0, width - fadeStart, height);
      ctx.fillStyle = "#000000";
      ctx.fillRect(fadeEnd, 0, width - fadeEnd, height);
      textCenterX = (fadeEnd + width) / 2;
      maxTextWidth = Math.min(420, width - fadeEnd - 40);
    }
    const pulse = Math.sin(progress * Math.PI * 2);
    const cleanText = options.text.trim();
    let fontSize = 34;
    if (cleanText.length > 200) fontSize = 18;
    else if (cleanText.length > 100) fontSize = 22;
    else if (cleanText.length > 40) fontSize = 28;
    ctx.font = `italic ${fontSize}px "Segoe Script", "Lucida Handwriting", "Brush Script MT", Georgia, cursive, serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    const lineHeight = fontSize * 1.4;
    const lines = wrapText(ctx, cleanText, maxTextWidth);
    const totalTextHeight = lines.length * lineHeight;
    const authorBlockHeight = 35;
    const startY = Math.max(60, (height - (totalTextHeight + authorBlockHeight)) / 2 + fontSize * 0.8);
    lines.forEach((line, index2) => {
      ctx.fillText(line, textCenterX, startY + index2 * lineHeight);
    });
    const mentionHandle = options.authorTag?.replace(/^@+/, "").trim();
    let rawAuthor = options.author?.replace(/<@!?\d+>/g, "").replace(/^@+/, "").trim() || "";
    let displayAuthor = "";
    if (mentionHandle) {
      displayAuthor = `@${mentionHandle}`;
    } else if (rawAuthor) {
      const normalized = rawAuthor.normalize("NFKD").trim();
      displayAuthor = `@${normalized}`;
    } else {
      displayAuthor = "@Anonymous";
    }
    const authorY = startY + (lines.length - 1) * lineHeight + 42;
    ctx.save();
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = pulse > 0 ? "#E5E7EB" : "#D1D5DB";
    ctx.shadowColor = pulse > 0 ? "rgba(168, 85, 247, 0.8)" : "rgba(239, 68, 68, 0.8)";
    ctx.shadowBlur = 4 + Math.abs(pulse) * 6;
    ctx.fillText(`- ${displayAuthor}`, textCenterX, authorY);
    ctx.restore();
    let watermarkText = (options.serverName || "A U R A   T A M I L").normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim();
    if (!watermarkText) watermarkText = "A U R A   T A M I L";
    ctx.textAlign = "right";
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = "#444444";
    ctx.fillText(watermarkText, width - 20, height - 20);
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize2(data, 128);
    const index = applyPalette2(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: frameDelay });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}

// src/bot/commands/index.ts
var SLASH_COMMANDS_DATA = [
  new import_discord2.SlashCommandBuilder().setName("help").setDescription("Explore Paradox commands, features, and dashboard link"),
  new import_discord2.SlashCommandBuilder().setName("ping").setDescription("Check bot latency and gateway connection"),
  new import_discord2.SlashCommandBuilder().setName("dashboard").setDescription("Get a direct link to this server's web companion dashboard"),
  new import_discord2.SlashCommandBuilder().setName("roles").setDescription("List active visual role decks and reaction roles for this server"),
  new import_discord2.SlashCommandBuilder().setName("serverinfo").setDescription("Display server statistics and bot permission health"),
  // 1. Specialist: Reaction Roles Command (with Multi-Mode Logic & Prerequisites)
  new import_discord2.SlashCommandBuilder().setName("reactionrole").setDescription("Specialist: Manage emoji reaction roles with custom mode logic").addSubcommand(
    (sub) => sub.setName("add").setDescription("Add an emoji reaction role with specialized mode logic").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addStringOption(
      (opt) => opt.setName("emoji").setDescription("The emoji trigger (e.g. \u2B50, \u{1F3AE})").setRequired(true)
    ).addRoleOption(
      (opt) => opt.setName("role").setDescription("The role to grant upon reacting").setRequired(true)
    ).addStringOption(
      (opt) => opt.setName("mode").setDescription("Role Assignment Logic").addChoices(
        { name: "Toggle (Normal claim & unclaim)", value: "TOGGLE" },
        { name: "Unique (Radio single-choice in this group)", value: "UNIQUE" },
        { name: "Verify (One-time claim only, locks in)", value: "VERIFY" },
        { name: "Reversed (Opt-out / removes role)", value: "REVERSED" }
      )
    ).addRoleOption(
      (opt) => opt.setName("required_role").setDescription("Prerequisite role needed to claim this role")
    ).addChannelOption(
      (opt) => opt.setName("channel").setDescription("The channel containing the message (defaults to current)").addChannelTypes(import_discord2.ChannelType.GuildText, import_discord2.ChannelType.GuildAnnouncement)
    ).addStringOption(
      (opt) => opt.setName("description").setDescription("Perk description displayed on claim")
    ).addStringOption(
      (opt) => opt.setName("badge_url").setDescription("Custom badge image/sticker icon URL")
    ).addStringOption(
      (opt) => opt.setName("celebration_gif").setDescription("Animated celebration GIF URL on claim")
    )
  ).addSubcommand(
    (sub) => sub.setName("remove").setDescription("Remove an existing reaction role mapping").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addStringOption(
      (opt) => opt.setName("emoji").setDescription("The emoji trigger to remove").setRequired(true)
    )
  ).addSubcommand(
    (sub) => sub.setName("list").setDescription("List all reaction roles configured in this server")
  ).addSubcommand(
    (sub) => sub.setName("clean").setDescription("Clean up deleted roles or deleted message mappings")
  ).addSubcommand(
    (sub) => sub.setName("setmode").setDescription("Change role selection mode for all roles on a message").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addStringOption(
      (opt) => opt.setName("mode").setDescription("Role Assignment Logic").setRequired(true).addChoices(
        { name: "Unique (Radio single-choice, auto-swaps)", value: "UNIQUE" },
        { name: "Onetime (Verify / one-time claim only)", value: "VERIFY" },
        { name: "Multirole (Free toggle, select multiple)", value: "TOGGLE" },
        { name: "Reversed (Opt-out / removes role)", value: "REVERSED" }
      )
    )
  ).addSubcommand(
    (sub) => sub.setName("restrict").setDescription("Set a prerequisite role restriction on a mapped role").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addRoleOption(
      (opt) => opt.setName("role").setDescription("The role to restrict").setRequired(true)
    ).addRoleOption(
      (opt) => opt.setName("required_role").setDescription("The prerequisite role needed").setRequired(true)
    )
  ).addSubcommand(
    (sub) => sub.setName("unrestrict").setDescription("Remove prerequisite requirement from a role on a message").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addRoleOption(
      (opt) => opt.setName("role").setDescription("The role to unrestrict").setRequired(true)
    )
  ).addSubcommand(
    (sub) => sub.setName("delete_deck").setDescription("Delete an entire role deck and all its role mappings").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addBooleanOption(
      (opt) => opt.setName("delete_message").setDescription("Also delete the message from the Discord channel?")
    )
  ).addSubcommand(
    (sub) => sub.setName("purge").setDescription("Delete ALL reaction role mappings and decks for this server").addBooleanOption(
      (opt) => opt.setName("delete_messages").setDescription("Also delete associated messages from Discord?")
    )
  ),
  // 2. Specialist: Visual Role Deck Command (Interactive Clickable Buttons & Animated GIF Header)
  new import_discord2.SlashCommandBuilder().setName("roledeck").setDescription("Specialist: Deploy interactive Visual Role Deck with buttons and banner GIF").addStringOption(
    (opt) => opt.setName("title").setDescription("Title for the role panel").setRequired(true)
  ).addRoleOption(
    (opt) => opt.setName("role1").setDescription("First role to include").setRequired(true)
  ).addStringOption(
    (opt) => opt.setName("emoji1").setDescription("Emoji for first role (e.g. \u{1F3AE})").setRequired(true)
  ).addRoleOption((opt) => opt.setName("role2").setDescription("Second role (optional)")).addStringOption((opt) => opt.setName("emoji2").setDescription("Emoji for second role")).addRoleOption((opt) => opt.setName("role3").setDescription("Third role (optional)")).addStringOption((opt) => opt.setName("emoji3").setDescription("Emoji for third role")).addStringOption(
    (opt) => opt.setName("mode").setDescription("Role selection behavior").addChoices(
      { name: "Unique (Pick one only, automatically swaps)", value: "UNIQUE" },
      { name: "Toggle (Normal select / unselect)", value: "TOGGLE" },
      { name: "Verify (One-time claim only)", value: "VERIFY" }
    )
  ).addRoleOption(
    (opt) => opt.setName("required_role").setDescription("Prerequisite role needed to claim roles in this deck")
  ).addStringOption(
    (opt) => opt.setName("banner_gif").setDescription("Header banner image or animated GIF URL")
  ).addStringOption(
    (opt) => opt.setName("description").setDescription("Description text above buttons")
  ).addChannelOption(
    (opt) => opt.setName("channel").setDescription("Destination channel (defaults to current)").addChannelTypes(import_discord2.ChannelType.GuildText, import_discord2.ChannelType.GuildAnnouncement)
  ),
  // 3. Specialist: Social Video Fixer Command
  new import_discord2.SlashCommandBuilder().setName("videofix").setDescription("Specialist: Social Video Embed Fixer (Twitter, TikTok, Instagram, Reddit, Bluesky, Threads)").addSubcommand(
    (sub) => sub.setName("status").setDescription("Check video fixer status, supported providers, and settings")
  ).addSubcommand(
    (sub) => sub.setName("toggle").setDescription("Enable or disable video fixer server-wide")
  ).addSubcommand(
    (sub) => sub.setName("ignore").setDescription("Mute/unmute video fixing in a specific channel").addChannelOption(
      (opt) => opt.setName("channel").setDescription("Target channel").setRequired(true).addChannelTypes(import_discord2.ChannelType.GuildText)
    )
  ).addSubcommand(
    (sub) => sub.setName("deletebutton").setDescription("Toggle the author \u{1F5D1}\uFE0F Dismiss button on fixed previews").addBooleanOption(
      (opt) => opt.setName("enabled").setDescription("Show dismiss button?").setRequired(true)
    )
  ),
  // 4. Rich Embed Publisher & Editor
  new import_discord2.SlashCommandBuilder().setName("embed").setDescription("Create or edit a rich Discord embed in any channel").addChannelOption(
    (opt) => opt.setName("channel").setDescription("Destination channel").setRequired(true).addChannelTypes(import_discord2.ChannelType.GuildText, import_discord2.ChannelType.GuildAnnouncement)
  ).addStringOption(
    (opt) => opt.setName("title").setDescription("Embed title").setRequired(true)
  ).addStringOption(
    (opt) => opt.setName("description").setDescription("Embed description text").setRequired(true)
  ).addStringOption(
    (opt) => opt.setName("message_id").setDescription("Message ID to edit (leave blank to post a new embed)")
  ).addStringOption(
    (opt) => opt.setName("color").setDescription("Hex color (e.g. #5865F2, #57F287, #ED4245)")
  ).addStringOption(
    (opt) => opt.setName("image").setDescription("Large banner image or GIF URL")
  ).addStringOption(
    (opt) => opt.setName("thumbnail").setDescription("Small top-right thumbnail icon URL")
  ),
  // 5. AURA Feature 1: Clickable Server Invite Embed
  new import_discord2.SlashCommandBuilder().setName("postinvite").setDescription("Post a stylish server invite embed with native preview").addStringOption(
    (opt) => opt.setName("custom_message").setDescription("Custom message or tagline for the invite embed")
  ).addChannelOption(
    (opt) => opt.setName("channel").setDescription("Channel to post the invite into (defaults to current channel)").addChannelTypes(import_discord2.ChannelType.GuildText, import_discord2.ChannelType.GuildAnnouncement)
  ).addStringOption(
    (opt) => opt.setName("invite_url").setDescription("Override custom invite URL (e.g. https://discord.gg/yourcode)")
  ),
  // 6. AURA Feature 2: Make It a GIF
  new import_discord2.SlashCommandBuilder().setName("gif").setDescription("Convert a static image into an animated GIF with neon effects").addAttachmentOption(
    (opt) => opt.setName("image").setDescription("Upload a static image to animate (PNG, JPG, WEBP)")
  ).addStringOption(
    (opt) => opt.setName("url").setDescription("Or provide a direct image URL to animate")
  ).addStringOption(
    (opt) => opt.setName("style").setDescription("Animation aesthetic style").addChoices(
      { name: "Neon Pulse (Purple & Crimson)", value: "pulse" },
      { name: "Cinematic Zoom", value: "zoom" },
      { name: "Cyber Scanline", value: "scanline" }
    )
  ),
  // 7. AURA Feature 3: Make It a Quote (Photo Quote with User Avatar & Message)
  new import_discord2.SlashCommandBuilder().setName("quote").setDescription("Turn a message or text into an AURA photo quote with the user's avatar").addStringOption(
    (opt) => opt.setName("quote").setDescription("Quote text to display (or leave blank if providing message ID/link)")
  ).addStringOption(
    (opt) => opt.setName("message").setDescription("Discord Message ID or Link to quote directly")
  ).addUserOption(
    (opt) => opt.setName("user").setDescription("User whose photo and name to quote")
  ).addStringOption(
    (opt) => opt.setName("author").setDescription("Author or speaker name override")
  ).addAttachmentOption(
    (opt) => opt.setName("background").setDescription("Optional custom background image attachment")
  ),
  // 8. AURA Feature 4: Animated Quote
  new import_discord2.SlashCommandBuilder().setName("animatedquote").setDescription("Generate an animated glowing quote card GIF with user photo").addStringOption(
    (opt) => opt.setName("quote").setDescription("Quote text to display (or leave blank if providing message ID/link)")
  ).addStringOption(
    (opt) => opt.setName("message").setDescription("Discord Message ID or Link to quote directly")
  ).addUserOption(
    (opt) => opt.setName("user").setDescription("User whose photo and name to quote")
  ).addStringOption(
    (opt) => opt.setName("author").setDescription("Author or speaker name override")
  ).addAttachmentOption(
    (opt) => opt.setName("background").setDescription("Optional custom background image attachment")
  ),
  // 9. Context Menu: Right-Click Any Message -> Apps -> "Quote Message"
  new import_discord2.ContextMenuCommandBuilder().setName("Quote Message").setType(import_discord2.ApplicationCommandType.Message)
];
async function resolveMessageFromInput(channel, input) {
  if (!input) return null;
  const trimmed = input.trim();
  const linkMatch = trimmed.match(/discord\.com\/channels\/\d+\/(\d+)\/(\d+)/);
  if (linkMatch) {
    const chId = linkMatch[1];
    const msgId = linkMatch[2];
    try {
      const ch = await channel.guild.channels.fetch(chId).catch(() => null);
      if (ch && "messages" in ch) {
        return await ch.messages.fetch(msgId).catch(() => null);
      }
    } catch {
    }
  }
  try {
    return await channel.messages.fetch(trimmed).catch(() => null);
  } catch {
  }
  return null;
}
async function handleSlashCommand(interaction) {
  const { commandName, guildId, guild, client, memberPermissions } = interaction;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const isManager = memberPermissions?.has(import_discord2.PermissionsBitField.Flags.ManageGuild) || memberPermissions?.has(import_discord2.PermissionsBitField.Flags.Administrator);
  if (commandName === "ping") {
    const ping = client.ws.ping;
    const embed = new import_discord2.EmbedBuilder().setColor(5763719).setTitle("\u{1F3D3} Pong!").setDescription(`Gateway WebSocket Latency: **${ping}ms**`).setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (commandName === "help") {
    const config = guildId ? await prisma.guildConfig.findUnique({ where: { id: guildId } }).catch(() => null) : null;
    const prefix = config?.prefix || "$";
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle("\u{1F916} Paradox Specialist Bot \u2014 Features & Commands").setDescription(
      `Paradox is a dual-specialist bot built for **Visual Role Decks & Reaction Roles** and **High-Performance Social Video Link Fixes**.

Command Prefix: \`${prefix}\` | Slash Commands: \`/\``
    ).addFields(
      {
        name: "\u{1F3AD} 1. Visual Role Decks & Reaction Roles Specialist",
        value: `\`/reactionrole add\` \u2014 Configure reaction role with custom modes (\`TOGGLE\`, \`UNIQUE\`, \`VERIFY\`, \`REVERSED\`)
\`/reactionrole remove\` \u2014 Delete reaction role
\`/reactionrole clean\` \u2014 Purge deleted message/role records
\`/roledeck\` \u2014 Deploy visual card with clickable buttons & animated banner GIF
\`${prefix}rr add <msgId> <emoji> <@role> [mode]\` \u2014 Quick text command`
      },
      {
        name: "\u{1F3A5} 2. Social Video Embed Fixer Specialist",
        value: `Supports: **X/Twitter**, **TikTok**, **Instagram Reels**, **Reddit**, **Bluesky**, **Threads**.
\`/videofix status\` \u2014 View fixer health & providers
\`/videofix toggle\` \u2014 Enable/disable server-wide
\`/videofix ignore\` \u2014 Mute in specific channels
\`/videofix deletebutton\` \u2014 Toggle \u{1F5D1}\uFE0F author dismiss button
\`${prefix}videofix toggle\` \u2014 Quick text toggle`
      },
      {
        name: "\u{1F4E2} 3. Embeds & Utilities",
        value: `\`/embed\` \u2014 Post rich embed messages
\`${prefix}prefix <newPrefix>\` \u2014 Change server prefix
\`/serverinfo\` \u2014 Server stats & bot role position
\`/dashboard\` \u2014 Web dashboard link`
      },
      {
        name: "\u2728 4. Creative & Community Tools",
        value: "`/postinvite [message] [channel] [url]` \u2014 Staff: Post branded invite embed & native preview\n`/gif <image|url> [style]` \u2014 Transform a static picture into an animated GIF\n`/quote <quote> [author] [background]` \u2014 Generate an AURA quote card image\n`/animatedquote <quote> [author] [background]` \u2014 Generate an animated glowing quote card GIF"
      }
    ).setFooter({ text: "Paradox \u2022 Specialist Discord Bot" }).setTimestamp();
    const row = new import_discord2.ActionRowBuilder().addComponents(
      new import_discord2.ButtonBuilder().setLabel("Open Web Dashboard").setStyle(import_discord2.ButtonStyle.Link).setURL(guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`)
    );
    return interaction.reply({ embeds: [embed], components: [row] });
  }
  if (commandName === "reactionrole") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "list") {
      const mappings = await prisma.reactionRole.findMany({ where: { guildId } }).catch(() => []);
      if (mappings.length === 0) {
        return interaction.reply({
          content: "No reaction roles configured yet. Use `/reactionrole add` or `/roledeck`!",
          ephemeral: true
        });
      }
      const listText = mappings.map(
        (m) => `\u2022 ${m.emoji} **${m.roleName}** [Mode: \`${m.mode || "TOGGLE"}\`] in <#${m.channelId}> \u2014 Msg: \`${m.messageId}\``
      ).join("\n");
      const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(`\u{1F3AD} Active Reaction Roles (${mappings.length})`).setDescription(listText).setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (!isManager) {
      return interaction.reply({
        content: "\u26D4 You need the **Manage Server** permission to configure reaction roles.",
        ephemeral: true
      });
    }
    if (subcommand === "clean") {
      const all = await prisma.reactionRole.findMany({ where: { guildId } });
      let purged = 0;
      for (const m of all) {
        const roleExists = guild.roles.cache.has(m.roleId);
        if (!roleExists) {
          await prisma.reactionRole.delete({ where: { id: m.id } });
          purged++;
        }
      }
      return interaction.reply({ content: `\u{1F9F9} Cleaned up **${purged}** orphaned role mapping(s).`, ephemeral: true });
    }
    if (subcommand === "add") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();
      const role = interaction.options.getRole("role", true);
      const mode = interaction.options.getString("mode") || "TOGGLE";
      const requiredRole = interaction.options.getRole("required_role");
      const desc = interaction.options.getString("description");
      const badgeUrl = interaction.options.getString("badge_url");
      const celebrationGif = interaction.options.getString("celebration_gif");
      const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
      if (!targetChannel) return interaction.reply({ content: "Invalid channel.", ephemeral: true });
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({ content: "\u274C Bot lacks **Manage Roles** permission.", ephemeral: true });
      }
      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `\u274C Role Hierarchy Error: **${role.name}** is higher than or equal to the bot's role. Drag the bot's role above **${role.name}** in Server Settings.`,
          ephemeral: true
        });
      }
      if (role.managed) {
        return interaction.reply({ content: "\u274C Cannot assign managed / integration roles.", ephemeral: true });
      }
      try {
        const msg = await targetChannel.messages.fetch(messageId).catch(() => null);
        if (msg) await msg.react(emoji).catch(() => null);
      } catch {
      }
      await prisma.reactionRole.create({
        data: {
          guildId,
          channelId: targetChannel.id,
          messageId,
          emoji,
          roleId: role.id,
          roleName: role.name,
          description: desc || null,
          type: "REACTION",
          mode,
          requiredRoleId: requiredRole?.id || null,
          imageUrl: badgeUrl || null,
          confirmGif: celebrationGif || null
        }
      });
      const embed = new import_discord2.EmbedBuilder().setColor(5763719).setTitle("\u2705 Reaction Role Configured!").setDescription(
        `Reacting with ${emoji} on message \`${messageId}\` will assign **${role.name}**.

\u2022 **Mode:** \`${mode}\`
` + (requiredRole ? `\u2022 **Prerequisite:** Requires <@&${requiredRole.id}>
` : "") + (desc ? `\u2022 **Perks:** ${desc}` : "")
      ).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (subcommand === "remove") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();
      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId, messageId, emoji }
      });
      return interaction.reply({
        content: `\u2705 Removed ${deleted.count} mapping(s) for ${emoji} on message \`${messageId}\`.`,
        ephemeral: true
      });
    }
    if (subcommand === "setmode") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const newMode = interaction.options.getString("mode", true);
      const updated = await prisma.reactionRole.updateMany({
        where: { guildId, messageId },
        data: { mode: newMode }
      });
      if (updated.count === 0) {
        return interaction.reply({
          content: `\u26A0\uFE0F No reaction roles found on message \`${messageId}\`.`,
          ephemeral: true
        });
      }
      return interaction.reply({
        content: `\u2705 Successfully updated **${updated.count}** role mapping(s) on message \`${messageId}\` to mode **\`${newMode}\`**!`
      });
    }
    if (subcommand === "restrict") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const targetRole = interaction.options.getRole("role", true);
      const reqRole = interaction.options.getRole("required_role", true);
      const updated = await prisma.reactionRole.updateMany({
        where: { guildId, messageId, roleId: targetRole.id },
        data: { requiredRoleId: reqRole.id }
      });
      if (updated.count === 0) {
        return interaction.reply({
          content: `\u26A0\uFE0F No mapping found for role **${targetRole.name}** on message \`${messageId}\`.`,
          ephemeral: true
        });
      }
      return interaction.reply({
        content: `\u{1F512} **Restriction Enabled:** Members now require <@&${reqRole.id}> to claim **${targetRole.name}** on message \`${messageId}\`.`
      });
    }
    if (subcommand === "unrestrict") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const targetRole = interaction.options.getRole("role", true);
      const updated = await prisma.reactionRole.updateMany({
        where: { guildId, messageId, roleId: targetRole.id },
        data: { requiredRoleId: null }
      });
      return interaction.reply({
        content: `\u{1F513} **Restriction Removed:** Anyone can now claim **${targetRole.name}** on message \`${messageId}\`.`
      });
    }
    if (subcommand === "delete_deck") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const deleteMessage = interaction.options.getBoolean("delete_message") || false;
      const mappings = await prisma.reactionRole.findMany({
        where: { guildId, messageId }
      });
      if (mappings.length === 0) {
        return interaction.reply({
          content: `\u26A0\uFE0F No role deck found matching Message ID \`${messageId}\`.`,
          ephemeral: true
        });
      }
      const count = mappings.length;
      const channelId = mappings[0].channelId;
      if (deleteMessage && channelId) {
        try {
          const ch = await guild.channels.fetch(channelId).catch(() => null);
          if (ch && "messages" in ch) {
            const msg = await ch.messages.fetch(messageId).catch(() => null);
            if (msg) await msg.delete().catch(() => null);
          }
        } catch {
        }
      }
      await prisma.reactionRole.deleteMany({
        where: { guildId, messageId }
      });
      return interaction.reply({
        content: `\u{1F5D1}\uFE0F **Role Deck Deleted:** Removed all **${count}** role mapping(s) from message \`${messageId}\`${deleteMessage ? " and deleted the Discord message" : ""}!`
      });
    }
    if (subcommand === "purge") {
      const deleteMessages = interaction.options.getBoolean("delete_messages") || false;
      if (deleteMessages) {
        const distinctMessages = await prisma.reactionRole.findMany({
          where: { guildId },
          select: { channelId: true, messageId: true },
          distinct: ["channelId", "messageId"]
        });
        for (const m of distinctMessages) {
          if (m.channelId && m.messageId) {
            try {
              const ch = await guild.channels.fetch(m.channelId).catch(() => null);
              if (ch && "messages" in ch) {
                const msg = await ch.messages.fetch(m.messageId).catch(() => null);
                if (msg) await msg.delete().catch(() => null);
              }
            } catch {
            }
          }
        }
      }
      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId }
      });
      return interaction.reply({
        content: `\u{1F9F9} **Purge Complete:** Successfully deleted all **${deleted.count}** reaction role mappings and decks in this server${deleteMessages ? " and deleted their Discord messages" : ""}!`
      });
    }
  }
  if (commandName === "roledeck") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    if (!isManager) return interaction.reply({ content: "\u26D4 You need the **Manage Server** permission.", ephemeral: true });
    const title = interaction.options.getString("title", true);
    const desc = interaction.options.getString("description") || "Click the buttons below to claim or remove roles:";
    const mode = interaction.options.getString("mode") || "TOGGLE";
    const requiredRole = interaction.options.getRole("required_role");
    const bannerGif = interaction.options.getString("banner_gif");
    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
    if (!targetChannel) return interaction.reply({ content: "Invalid channel.", ephemeral: true });
    const deckRoles = [];
    const r1 = interaction.options.getRole("role1", true);
    const e1 = interaction.options.getString("emoji1", true);
    deckRoles.push({ role: r1, emoji: e1 });
    const r2 = interaction.options.getRole("role2");
    const e2 = interaction.options.getString("emoji2");
    if (r2 && e2) deckRoles.push({ role: r2, emoji: e2 });
    const r3 = interaction.options.getRole("role3");
    const e3 = interaction.options.getString("emoji3");
    if (r3 && e3) deckRoles.push({ role: r3, emoji: e3 });
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "\u274C Bot lacks **Manage Roles** permission.", ephemeral: true });
    }
    for (const item of deckRoles) {
      if (item.role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `\u274C Role Hierarchy Error: **${item.role.name}** is higher than or equal to the bot's role.`,
          ephemeral: true
        });
      }
    }
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(`\u2728 ${title}`).setDescription(desc).setFooter({ text: `Paradox Role Deck \u2022 Mode: ${mode}` }).setTimestamp();
    if (bannerGif) embed.setImage(bannerGif);
    const row = new import_discord2.ActionRowBuilder();
    for (const item of deckRoles) {
      embed.addFields({
        name: `${item.emoji} ${item.role.name}`,
        value: "Click button below to toggle",
        inline: true
      });
      row.addComponents(
        new import_discord2.ButtonBuilder().setCustomId(`rr_role_${item.role.id}`).setLabel(item.role.name).setStyle(import_discord2.ButtonStyle.Primary)
      );
    }
    const sentMsg = await targetChannel.send({ embeds: [embed], components: [row] });
    for (const item of deckRoles) {
      await prisma.reactionRole.create({
        data: {
          guildId,
          channelId: targetChannel.id,
          messageId: sentMsg.id,
          emoji: item.emoji,
          roleId: item.role.id,
          roleName: item.role.name,
          type: "BUTTON",
          mode,
          requiredRoleId: requiredRole?.id || null,
          bannerUrl: bannerGif || null
        }
      });
    }
    return interaction.reply({
      content: `\u{1F389} Visual Role Deck deployed to <#${targetChannel.id}> with mode \`${mode}\`!`,
      ephemeral: true
    });
  }
  if (commandName === "videofix") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const config = await prisma.guildConfig.findUnique({ where: { id: guildId } }).catch(() => null);
    if (subcommand === "status") {
      const enabled = config?.videoFixerEnabled ?? true;
      const deleteBtn = config?.videoFixerDeleteButton ?? true;
      let providers = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"];
      try {
        if (config?.videoFixerProviders) providers = JSON.parse(config.videoFixerProviders);
      } catch {
      }
      const embed = new import_discord2.EmbedBuilder().setColor(enabled ? 5763719 : 15548997).setTitle("\u{1F3A5} Specialist: Social Video Fixer Engine").setDescription(
        `Status: **${enabled ? "Active \u2705" : "Disabled \u274C"}**
Author Dismiss Button: **${deleteBtn ? "Enabled \u{1F5D1}\uFE0F" : "Disabled"}**`
      ).addFields({
        name: "Supported Platforms",
        value: providers.map((p) => `\u2022 **${p.toUpperCase()}**`).join("\n")
      }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (!isManager) return interaction.reply({ content: "\u26D4 You need **Manage Server** permission.", ephemeral: true });
    if (subcommand === "toggle") {
      const current = config?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guildId },
        data: { videoFixerEnabled: !current }
      });
      return interaction.reply({
        content: `\u{1F3A5} Video Fixer is now **${updated.videoFixerEnabled ? "Enabled \u2705" : "Disabled \u274C"}**!`
      });
    }
    if (subcommand === "deletebutton") {
      const enabled = interaction.options.getBoolean("enabled", true);
      await prisma.guildConfig.update({
        where: { id: guildId },
        data: { videoFixerDeleteButton: enabled }
      });
      return interaction.reply({
        content: `\u{1F5D1}\uFE0F Author Dismiss Button is now **${enabled ? "Enabled" : "Disabled"}**.`
      });
    }
    if (subcommand === "ignore") {
      const targetChannel = interaction.options.getChannel("channel", true);
      let ignored = [];
      try {
        if (config?.videoFixerIgnoredChannels) ignored = JSON.parse(config.videoFixerIgnoredChannels);
      } catch {
      }
      if (ignored.includes(targetChannel.id)) {
        ignored = ignored.filter((id) => id !== targetChannel.id);
        await prisma.guildConfig.update({
          where: { id: guildId },
          data: { videoFixerIgnoredChannels: JSON.stringify(ignored) }
        });
        return interaction.reply({ content: `\u2705 <#${targetChannel.id}> is now **unignored**.` });
      } else {
        ignored.push(targetChannel.id);
        await prisma.guildConfig.update({
          where: { id: guildId },
          data: { videoFixerIgnoredChannels: JSON.stringify(ignored) }
        });
        return interaction.reply({ content: `\u{1F507} <#${targetChannel.id}> is now **ignored**.` });
      }
    }
  }
  if (commandName === "embed") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    if (!isManager) return interaction.reply({ content: "\u26D4 You need the **Manage Server** permission.", ephemeral: true });
    const targetChannel = interaction.options.getChannel("channel", true);
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const messageId = interaction.options.getString("message_id");
    const colorHex = interaction.options.getString("color") || "#5865F2";
    const image = interaction.options.getString("image");
    const thumbnail = interaction.options.getString("thumbnail");
    const embed = new import_discord2.EmbedBuilder().setTitle(title).setDescription(description).setTimestamp();
    try {
      embed.setColor(parseInt(colorHex.replace("#", ""), 16));
    } catch {
      embed.setColor(5793266);
    }
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (messageId && messageId.trim()) {
      const targetMsg = await targetChannel.messages.fetch(messageId.trim()).catch(() => null);
      if (!targetMsg) {
        return interaction.reply({
          content: `\u274C Could not find message \`${messageId.trim()}\` in <#${targetChannel.id}>. Make sure the message exists in this channel.`,
          ephemeral: true
        });
      }
      if (targetMsg.author.id !== client.user?.id) {
        return interaction.reply({
          content: `\u274C Paradox can only edit embed messages sent by Paradox itself.`,
          ephemeral: true
        });
      }
      await targetMsg.edit({ embeds: [embed] });
      return interaction.reply({
        content: `\u2705 Successfully edited embed for message \`${messageId.trim()}\` in <#${targetChannel.id}>!`,
        ephemeral: true
      });
    }
    const sent = await targetChannel.send({ embeds: [embed] });
    return interaction.reply({
      content: `\u2705 Embed published to <#${targetChannel.id}>! (Message ID: \`${sent.id}\`)`,
      ephemeral: true
    });
  }
  if (commandName === "dashboard") {
    const dashboardUrl = guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`;
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle("\u2699\uFE0F Server Dashboard").setDescription(`Configure Paradox for **${guild?.name}**:`).setTimestamp();
    const row = new import_discord2.ActionRowBuilder().addComponents(
      new import_discord2.ButtonBuilder().setLabel("Open Web Dashboard").setStyle(import_discord2.ButtonStyle.Link).setURL(dashboardUrl)
    );
    return interaction.reply({ embeds: [embed], components: [row] });
  }
  if (commandName === "serverinfo") {
    if (!guild) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    const botMember = await guild.members.fetchMe().catch(() => null);
    const botRoleName = botMember?.roles.highest.name || "None";
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(`\u{1F4CA} Server Info: ${guild.name}`).setThumbnail(guild.iconURL() || null).addFields(
      { name: "Server ID", value: guild.id, inline: true },
      { name: "Total Members", value: `${guild.memberCount}`, inline: true },
      { name: "Bot Role", value: botRoleName, inline: true }
    ).setFooter({ text: "Paradox Bot" }).setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (commandName === "postinvite") {
    if (!guild || !guildId) {
      return interaction.reply({ content: "\u274C This command can only be used inside a server.", ephemeral: true });
    }
    if (!isManager) {
      return interaction.reply({
        content: "\u26D4 You need the **Manage Server** or **Administrator** permission to post server invites.",
        ephemeral: true
      });
    }
    await interaction.deferReply({ ephemeral: true });
    const customMessage = interaction.options.getString("custom_message");
    const overrideUrl = interaction.options.getString("invite_url");
    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
    if (!targetChannel) {
      return interaction.editReply({ content: "\u274C Target channel not found or invalid." });
    }
    let inviteUrl = overrideUrl?.trim();
    if (!inviteUrl) {
      if (guild.vanityURLCode) {
        inviteUrl = `https://discord.gg/${guild.vanityURLCode}`;
      } else {
        try {
          const existingInvites = await guild.invites.fetch();
          const permanentInvite = existingInvites.find(
            (inv) => !inv.temporary && (inv.maxAge === 0 || inv.maxAge === null)
          );
          if (permanentInvite) {
            inviteUrl = permanentInvite.url;
          }
        } catch {
        }
        if (!inviteUrl) {
          try {
            const newInvite = await targetChannel.createInvite({
              maxAge: 0,
              maxUses: 0,
              unique: false,
              reason: `Aura /postinvite executed by ${interaction.user.tag}`
            });
            inviteUrl = newInvite.url;
          } catch (err) {
            return interaction.editReply({
              content: `\u274C Could not dynamically create an invite link: ${err.message}. Please provide an invite URL in the \`invite_url\` parameter or grant the bot **Create Instant Invite** permissions.`
            });
          }
        }
      }
    }
    const serverName = guild.name;
    const serverIcon = guild.iconURL({ size: 512 });
    const defaultTagline = "Enter the Aura. Find your people. Make memories.";
    const descriptionText = customMessage?.trim() || defaultTagline;
    const embed = new import_discord2.EmbedBuilder().setColor(9133302).setTitle(`\u2728 Welcome to ${serverName}`).setURL(inviteUrl).setDescription(
      `**${descriptionText}**

Click the title above or the button below to enter **${serverName}**!

\u{1F517} **Invite Link:** [${inviteUrl}](${inviteUrl})`
    ).setFooter({
      text: `${serverName} \u2022 Click title or button to join`,
      iconURL: serverIcon || void 0
    }).setTimestamp();
    if (serverIcon) {
      embed.setThumbnail(serverIcon);
    }
    const bannerUrl = guild.bannerURL({ size: 1024 }) || guild.splashURL({ size: 1024 });
    if (bannerUrl) {
      embed.setImage(bannerUrl);
    }
    const row = new import_discord2.ActionRowBuilder().addComponents(
      new import_discord2.ButtonBuilder().setLabel(`Join ${serverName}`).setStyle(import_discord2.ButtonStyle.Link).setURL(inviteUrl).setEmoji("\u{1F680}")
    );
    try {
      await targetChannel.send({
        content: `${inviteUrl}
*Enter the Aura. Find your people. Make memories.*`,
        embeds: [embed],
        components: [row]
      });
      return interaction.editReply({
        content: `\u2705 Branded server invite successfully posted to <#${targetChannel.id}>!
*(Note: Discord's native preview widget is rendered automatically by Discord clients and its appearance is controlled by Discord).*`
      });
    } catch (err) {
      return interaction.editReply({
        content: `\u274C Failed to post invite to <#${targetChannel.id}>: ${err.message}. Make sure the bot has **Send Messages** and **Embed Links** permissions in that channel.`
      });
    }
  }
  if (commandName === "gif") {
    const attachment = interaction.options.getAttachment("image");
    const url = interaction.options.getString("url");
    const style = interaction.options.getString("style") || "pulse";
    if (!attachment && !url) {
      return interaction.reply({
        content: "\u274C Please provide either an image attachment or a direct image URL.",
        ephemeral: true
      });
    }
    await interaction.deferReply();
    try {
      let imageBuffer;
      if (attachment) {
        if (!attachment.contentType?.startsWith("image/")) {
          return interaction.editReply({
            content: "\u274C The attached file must be an image (PNG, JPG, WEBP)."
          });
        }
        if (attachment.size > 8 * 1024 * 1024) {
          return interaction.editReply({
            content: "\u274C Image size exceeds the 8 MB maximum limit."
          });
        }
        imageBuffer = await fetchSafeImageBuffer(attachment.url, 8 * 1024 * 1024);
      } else {
        const check = validateImageUrl(url);
        if (!check.valid) {
          return interaction.editReply({
            content: `\u274C Invalid or unsafe image URL: ${check.reason}`
          });
        }
        imageBuffer = await fetchSafeImageBuffer(url, 8 * 1024 * 1024);
      }
      const gifBuffer = await makeImageIntoGif(imageBuffer, style);
      const fileAttachment = new import_discord2.AttachmentBuilder(gifBuffer, { name: "aura-animated.gif" });
      return interaction.editReply({
        content: `\u2728 **Animated GIF Ready!** (Style: \`${style}\`)`,
        files: [fileAttachment]
      });
    } catch (err) {
      return interaction.editReply({
        content: `\u274C Failed to generate animated GIF: ${err.message || "Unknown error occurred"}`
      });
    }
  }
  async function resolveMentionsToNames2(text, guild2) {
    if (!text) return text;
    let res = text;
    const userMentions = Array.from(res.matchAll(/<@!?(\d+)>/g));
    for (const m of userMentions) {
      const id = m[1];
      let name = null;
      if (guild2) {
        const member = guild2.members.cache.get(id) || await guild2.members.fetch(id).catch(() => null);
        name = member?.displayName || member?.user?.globalName || member?.user?.username || null;
      }
      if (!name && guild2?.client) {
        const user = await guild2.client.users.fetch(id).catch(() => null);
        name = user?.globalName || user?.username || null;
      }
      res = res.replace(m[0], `@${name || "User"}`);
    }
    if (guild2) {
      res = res.replace(/<#(\d+)>/g, (full, id) => {
        const ch = guild2.channels.cache.get(id);
        return ch ? `#${ch.name}` : full;
      });
      res = res.replace(/<@&(\d+)>/g, (full, id) => {
        const role = guild2.roles.cache.get(id);
        return role ? `@${role.name}` : full;
      });
    }
    return res;
  }
  if (commandName === "quote" || commandName === "Quote Message" || commandName === "animatedquote") {
    const isAnimated = commandName === "animatedquote";
    const isContextMenu = interaction.isMessageContextMenuCommand?.() || commandName === "Quote Message";
    await interaction.deferReply();
    try {
      let targetMsg = null;
      let quoteText = null;
      let targetUser = null;
      let authorOverride = null;
      let bgAttachment = null;
      if (isContextMenu) {
        targetMsg = interaction.targetMessage;
      } else {
        const messageInput = interaction.options.getString("message");
        if (messageInput) {
          targetMsg = await resolveMessageFromInput(interaction.channel, messageInput);
          if (!targetMsg) {
            return interaction.editReply({
              content: `\u274C Could not find message \`${messageInput}\`. Please make sure the message exists in this server and channel.`
            });
          }
        }
        targetUser = interaction.options.getUser("user");
        quoteText = interaction.options.getString("quote");
        authorOverride = interaction.options.getString("author");
        bgAttachment = interaction.options.getAttachment("background");
      }
      let authorUser = interaction.user;
      const initialMember = interaction.member;
      let authorName = initialMember?.displayName || interaction.user.globalName || interaction.user.username;
      let authorTag = interaction.user.username;
      let avatarUrl = initialMember?.displayAvatarURL({ extension: "png", size: 512 }) || interaction.user.displayAvatarURL({ extension: "png", size: 512 });
      let timestamp = void 0;
      if (targetMsg) {
        quoteText = quoteText || targetMsg.content || (targetMsg.attachments.size > 0 ? "[Photo / Attachment]" : "[Quoted Message]");
        authorUser = targetMsg.author;
        const msgMember = targetMsg.member || await guild?.members.fetch(targetMsg.author.id).catch(() => null);
        authorName = msgMember?.displayName || targetMsg.author.globalName || targetMsg.author.username;
        authorTag = targetMsg.author.username;
        avatarUrl = msgMember?.displayAvatarURL({ extension: "png", size: 512 }) || targetMsg.author.displayAvatarURL({ extension: "png", size: 512 });
        timestamp = targetMsg.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      } else if (targetUser) {
        authorUser = targetUser;
        const targetMember = await guild?.members.fetch(targetUser.id).catch(() => null);
        authorName = targetMember?.displayName || targetUser.globalName || targetUser.username;
        authorTag = targetUser.username;
        avatarUrl = targetMember?.displayAvatarURL({ extension: "png", size: 512 }) || targetUser.displayAvatarURL({ extension: "png", size: 512 });
      }
      if (authorOverride && authorOverride.trim()) {
        const rawOverride = authorOverride.trim();
        const mentionMatch = rawOverride.match(/<@!?(\d+)>/);
        const idToLookup = mentionMatch ? mentionMatch[1] : /^\d{17,20}$/.test(rawOverride) ? rawOverride : null;
        if (idToLookup) {
          const member = await guild?.members.fetch(idToLookup).catch(() => null);
          const user = member?.user || await client.users.fetch(idToLookup).catch(() => null);
          if (member) {
            authorUser = member.user;
            authorName = member.displayName;
            authorTag = member.user.username;
            if (!bgAttachment) avatarUrl = member.displayAvatarURL({ extension: "png", size: 512 });
          } else if (user) {
            authorUser = user;
            authorName = user.globalName || user.username;
            authorTag = user.username;
            if (!bgAttachment) avatarUrl = user.displayAvatarURL({ extension: "png", size: 512 });
          }
        } else {
          const cleanName = rawOverride.replace(/^@/, "").trim().toLowerCase();
          let memberMatch = guild ? (await guild.members.fetch({ query: cleanName, limit: 1 }).catch(() => null))?.first() : null;
          if (!memberMatch) {
            memberMatch = guild?.members.cache.find(
              (m) => m.displayName.toLowerCase() === cleanName || m.user.username.toLowerCase() === cleanName || m.user.globalName?.toLowerCase() === cleanName
            );
          }
          if (memberMatch) {
            authorUser = memberMatch.user;
            authorName = memberMatch.displayName;
            authorTag = memberMatch.user.username;
            if (!bgAttachment) avatarUrl = memberMatch.displayAvatarURL({ extension: "png", size: 512 });
          } else {
            authorName = rawOverride.replace(/^@/, "").trim();
          }
        }
      }
      authorName = await resolveMentionsToNames2(authorName, guild);
      if (/<@!?\d+>/.test(authorName)) {
        authorName = authorTag || "Anonymous";
      }
      authorName = authorName.replace(/^@+/, "").trim();
      if (!quoteText || !quoteText.trim()) {
        return interaction.editReply({
          content: "\u274C Quote text is required. Please provide text in the `quote` option or specify a message to quote."
        });
      }
      const cleanQuote = await resolveMentionsToNames2(quoteText.trim(), guild);
      const maxLength = isAnimated ? 600 : 1e3;
      if (cleanQuote.length > maxLength) {
        return interaction.editReply({
          content: `\u274C Quote text is too long! Please keep it under ${maxLength} characters.`
        });
      }
      let bgBuffer;
      if (bgAttachment) {
        if (!bgAttachment.contentType?.startsWith("image/")) {
          return interaction.editReply({
            content: "\u274C Background must be an image file (PNG, JPG, WEBP)."
          });
        }
        if (bgAttachment.size > 8 * 1024 * 1024) {
          return interaction.editReply({
            content: "\u274C Background image size exceeds the 8 MB maximum limit."
          });
        }
        bgBuffer = await fetchSafeImageBuffer(bgAttachment.url, 8 * 1024 * 1024);
      }
      const replyAuthor = (authorTag || authorName || "Anonymous").replace(/^@+/, "");
      if (isAnimated) {
        const gifBuffer = await generateAnimatedQuoteCard({
          text: cleanQuote,
          author: authorName,
          authorTag,
          avatarUrl,
          bgBuffer,
          serverName: guild?.name,
          timestamp
        });
        const fileAttachment = new import_discord2.AttachmentBuilder(gifBuffer, { name: "aura-animated-quote.gif" });
        return interaction.editReply({
          content: `\u2728 **Animated Quote by @${replyAuthor}**`,
          files: [fileAttachment]
        });
      } else {
        const cardBuffer = await generateQuoteCard({
          text: cleanQuote,
          author: authorName,
          authorTag,
          avatarUrl,
          bgBuffer,
          serverName: guild?.name,
          timestamp
        });
        const fileAttachment = new import_discord2.AttachmentBuilder(cardBuffer, { name: "aura-quote.png" });
        return interaction.editReply({
          content: `\u{1F4DC} **Quote by @${replyAuthor}**`,
          files: [fileAttachment]
        });
      }
    } catch (err) {
      return interaction.editReply({
        content: `\u274C Failed to generate quote card: ${err.message || "Unknown error occurred"}`
      });
    }
  }
}
async function handleTextCommand(message, prefix) {
  const content = message.content.slice(prefix.length).trim();
  const args = content.split(/\s+/);
  const command = args[0]?.toLowerCase();
  const guild = message.guild;
  const member = message.member;
  const isManager = member?.permissions.has(import_discord2.PermissionsBitField.Flags.ManageGuild) || member?.permissions.has(import_discord2.PermissionsBitField.Flags.Administrator);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (command === "ping") {
    const ping = message.client.ws.ping;
    return message.reply(`\u{1F3D3} Pong! WebSocket Latency: **${ping}ms**`);
  }
  if (command === "quote" || command === "q") {
    let targetMsg = null;
    let quoteText = null;
    if (message.reference?.messageId) {
      try {
        targetMsg = await message.fetchReference().catch(() => null);
        if (!targetMsg && message.channel && "messages" in message.channel) {
          targetMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        }
      } catch {
      }
      if (args.length > 1) {
        quoteText = args.slice(1).join(" ");
      }
    } else if (args[1]) {
      targetMsg = await resolveMessageFromInput(message.channel, args[1]);
      if (!targetMsg) {
        quoteText = args.slice(1).join(" ");
      }
    }
    let authorUser = message.author;
    let authorName = message.member?.displayName || message.author.globalName || message.author.username;
    let authorTag = message.author.username;
    let avatarUrl = message.member?.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) || message.author.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
    if (targetMsg) {
      quoteText = quoteText || targetMsg.content || (targetMsg.attachments.size > 0 ? "[Photo / Attachment]" : "[Quoted Message]");
      authorUser = targetMsg.author;
      const targetMember = targetMsg.member || await guild?.members.fetch(targetMsg.author.id).catch(() => null);
      authorName = targetMember?.displayName || targetMsg.author.globalName || targetMsg.author.username;
      authorTag = targetMsg.author.username;
      avatarUrl = targetMember?.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) || targetMsg.author.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
    } else if (message.mentions.users.size > 0) {
      const mentionedMember = message.mentions.members?.first();
      const mentionedUser = message.mentions.users.first();
      authorUser = mentionedUser;
      authorName = mentionedMember?.displayName || mentionedUser.globalName || mentionedUser.username;
      authorTag = mentionedUser.username;
      avatarUrl = mentionedMember?.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) || mentionedUser.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
      quoteText = args.slice(1).join(" ").replace(/<@!?\d+>/g, "").trim();
    } else {
      const rawText = args.slice(1).join(" ").trim();
      const dashMatch = rawText.match(/^["“”]?(.*?)["“”]?\s*[-—–]\s*@?([A-Za-z0-9_.\s]+)$/);
      if (dashMatch) {
        quoteText = dashMatch[1].trim();
        const possibleName = dashMatch[2].trim().toLowerCase();
        let memberMatch = guild ? (await guild.members.fetch({ query: possibleName, limit: 1 }).catch(() => null))?.first() : null;
        if (!memberMatch) {
          memberMatch = guild?.members.cache.find(
            (m) => m.displayName.toLowerCase() === possibleName || m.user.username.toLowerCase() === possibleName || m.user.globalName?.toLowerCase() === possibleName
          );
        }
        if (memberMatch) {
          authorUser = memberMatch.user;
          authorName = memberMatch.displayName;
          authorTag = memberMatch.user.username;
          avatarUrl = memberMatch.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
        } else {
          authorName = dashMatch[2].trim();
        }
      }
    }
    if (!quoteText || !quoteText.trim()) {
      return message.reply(`\u{1F4A1} **Usage:** Reply to any message and type \`${prefix}quote\` to turn it into a photo quote!`);
    }
    authorName = await resolveMentionsToNames(authorName, guild);
    if (/<@!?\d+>/.test(authorName)) {
      authorName = authorTag || "Anonymous";
    }
    authorName = authorName.replace(/^@+/, "").trim();
    const cleanQuote = await resolveMentionsToNames(quoteText.trim(), guild);
    await message.channel.sendTyping().catch(() => null);
    try {
      const cardBuffer = await generateQuoteCard({
        text: cleanQuote,
        author: authorName,
        authorTag,
        avatarUrl,
        serverName: guild?.name
      });
      const replyAuthor = (authorTag || authorName || "Anonymous").replace(/^@+/, "");
      const fileAttachment = new import_discord2.AttachmentBuilder(cardBuffer, { name: "quote.png" });
      return message.reply({
        content: `\u{1F4DC} **Quote by @${replyAuthor}**`,
        files: [fileAttachment]
      });
    } catch (err) {
      console.error("[Bot:Quote] Error generating quote card:", err);
      return message.reply(`\u274C Failed to generate quote card: ${err.message}`);
    }
  }
  if (command === "help") {
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle("\u{1F916} Paradox Specialist Bot \u2014 Command Guide").setDescription(
      `Current Server Prefix: \`${prefix}\`

Paradox is optimized for **Visual Roles** and **Social Video Fixes**.`
    ).addFields(
      {
        name: "\u{1F3AD} Roles & Reaction Commands",
        value: `\`${prefix}rr unique <msgId> <emoji> <@role>\` \u2014 Single-choice role (auto-swaps)
\`${prefix}rr onetime <msgId> <emoji> <@role>\` \u2014 One-time claim (verification lock)
\`${prefix}rr multi <msgId> <emoji> <@role>\` \u2014 Multi-role (toggle freely)
\`${prefix}rr restrict <msgId> <emoji> <@role> <@reqRole>\` \u2014 Restricted role
\`${prefix}rr setmode <msgId> <unique|onetime|multi>\` \u2014 Switch message mode
\`${prefix}rr remove <msgId> <emoji>\` \u2014 Remove mapping
\`${prefix}rr deletedeck <msgId> [--discord]\` \u2014 Delete entire deck & roles
\`${prefix}rr purge [--discord]\` \u2014 Purge all role mappings in server
\`${prefix}rr list\` \u2014 List active mappings`
      },
      {
        name: "\u{1F3A5} Video Fixer Commands",
        value: `\`${prefix}videofix status\` \u2014 Fixer status & platforms
\`${prefix}videofix toggle\` \u2014 Toggle on/off
\`${prefix}videofix deletebtn <on|off>\` \u2014 Toggle author \u{1F5D1}\uFE0F button`
      },
      {
        name: "\u{1F4E2} Embeds & Utilities",
        value: `\`${prefix}embed <title> | <description>\` \u2014 Post quick embed
\`${prefix}embed edit <msgId> <title> | <description>\` \u2014 Edit existing embed
\`${prefix}prefix <newPrefix>\` \u2014 Change server prefix
\`${prefix}dashboard\` \u2014 Web dashboard link`
      }
    ).setFooter({ text: "Type '/' to use interactive Discord slash commands!" }).setTimestamp();
    return message.reply({ embeds: [embed] });
  }
  if (command === "prefix") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("\u26D4 You need the **Manage Server** permission to change prefix.");
    const newPrefix = args[1]?.trim();
    if (!newPrefix || newPrefix.length > 5) {
      return message.reply(`Usage: \`${prefix}prefix <newPrefix>\` (1-5 characters)`);
    }
    await prisma.guildConfig.update({
      where: { id: guild.id },
      data: { prefix: newPrefix }
    });
    return message.reply(`\u2705 Command prefix updated! The new prefix is now \`${newPrefix}\` (e.g. \`${newPrefix}help\`).`);
  }
  if (command === "rr" || command === "reactionrole") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("\u26D4 You need the **Manage Server** permission.");
    const sub = args[1]?.toLowerCase();
    if (sub === "add") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);
      const mode = args[5]?.toUpperCase() || "TOGGLE";
      if (!msgId || !emoji || !roleMention) {
        return message.reply(
          `Usage: \`${prefix}rr add <message_id> <emoji> <@role> [TOGGLE|UNIQUE|VERIFY]\``
        );
      }
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("\u274C The bot is missing **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`\u274C **${roleMention.name}** is positioned higher than the bot's role.`);
      }
      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);
      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode
        }
      });
      return message.reply(
        `\u2705 Reaction role configured with mode \`${mode}\`! Reacting with ${emoji} grants **${roleMention.name}**.`
      );
    }
    if (sub === "unique") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);
      if (!msgId || !emoji || !roleMention) {
        return message.reply(`Usage: \`${prefix}rr unique <message_id> <emoji> <@role>\`
*Selecting this role will revoke any previously equipped role in this panel.*`);
      }
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("\u274C The bot is missing **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`\u274C **${roleMention.name}** is positioned higher than the bot's role.`);
      }
      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);
      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode: "UNIQUE"
        }
      });
      return message.reply(`\u{1F518} **Unique Role Configured:** Reacting with ${emoji} gives **${roleMention.name}** and revokes other roles in this group!`);
    }
    if (sub === "onetime" || sub === "verify") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);
      if (!msgId || !emoji || !roleMention) {
        return message.reply(`Usage: \`${prefix}rr onetime <message_id> <emoji> <@role>\`
*Members can claim this role only once; cannot be removed.*`);
      }
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("\u274C The bot is missing **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`\u274C **${roleMention.name}** is positioned higher than the bot's role.`);
      }
      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);
      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode: "VERIFY"
        }
      });
      return message.reply(`\u{1F512} **One-Time Role Configured:** Reacting with ${emoji} grants **${roleMention.name}** permanently (verification lock)!`);
    }
    if (sub === "multi" || sub === "multirole") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);
      if (!msgId || !emoji || !roleMention) {
        return message.reply(`Usage: \`${prefix}rr multi <message_id> <emoji> <@role>\`
*Members can toggle multiple roles freely.*`);
      }
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("\u274C The bot is missing **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`\u274C **${roleMention.name}** is positioned higher than the bot's role.`);
      }
      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);
      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode: "TOGGLE"
        }
      });
      return message.reply(`\u{1F501} **Multi-Role Configured:** Reacting with ${emoji} toggles **${roleMention.name}**.`);
    }
    if (sub === "restrict") {
      const msgId = args[2];
      const emoji = args[3];
      const rolesMentioned = message.mentions.roles;
      const targetRole = rolesMentioned.first() || guild.roles.cache.get(args[4]);
      const requiredRole = rolesMentioned.size > 1 ? rolesMentioned.at(1) : guild.roles.cache.get(args[5]);
      if (!msgId || !emoji || !targetRole || !requiredRole) {
        return message.reply(`Usage: \`${prefix}rr restrict <message_id> <emoji> <@targetRole> <@requiredRole>\`
*Requires members to have @requiredRole before they can claim @targetRole.*`);
      }
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("\u274C The bot is missing **Manage Roles** permission.");
      }
      if (targetRole.position >= botMember.roles.highest.position) {
        return message.reply(`\u274C **${targetRole.name}** is positioned higher than the bot's role.`);
      }
      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);
      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: targetRole.id,
          roleName: targetRole.name,
          type: "REACTION",
          mode: "TOGGLE",
          requiredRoleId: requiredRole.id
        }
      });
      return message.reply(`\u{1F6E1}\uFE0F **Restricted Role Configured:** Reacting with ${emoji} grants **${targetRole.name}**, but ONLY if the member already has **${requiredRole.name}**!`);
    }
    if (sub === "setmode" || sub === "mode") {
      const msgId = args[2];
      const rawMode = args[3]?.toLowerCase();
      let modeToSet = "TOGGLE";
      if (rawMode === "unique" || rawMode === "radio") modeToSet = "UNIQUE";
      else if (rawMode === "onetime" || rawMode === "verify") modeToSet = "VERIFY";
      else if (rawMode === "multi" || rawMode === "toggle") modeToSet = "TOGGLE";
      else if (rawMode === "reversed" || rawMode === "remove") modeToSet = "REVERSED";
      else {
        return message.reply(`Usage: \`${prefix}rr setmode <message_id> <unique|onetime|multi|reversed>\``);
      }
      const updated = await prisma.reactionRole.updateMany({
        where: { guildId: guild.id, messageId: msgId },
        data: { mode: modeToSet }
      });
      if (updated.count === 0) {
        return message.reply(`\u26A0\uFE0F No reaction role mappings found for message \`${msgId}\`.`);
      }
      return message.reply(`\u2705 Updated **${updated.count}** role mapping(s) on message \`${msgId}\` to mode **\`${modeToSet}\`**!`);
    }
    if (sub === "remove") {
      const msgId = args[2];
      const emoji = args[3];
      if (!msgId || !emoji) return message.reply(`Usage: \`${prefix}rr remove <message_id> <emoji>\``);
      await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id, messageId: msgId, emoji }
      });
      return message.reply(`\u2705 Removed mapping for ${emoji} on message \`${msgId}\`.`);
    }
    if (sub === "deletedeck" || sub === "deldeck") {
      const msgId = args[2]?.trim();
      const deleteMsg = args[3]?.toLowerCase() === "--discord" || args[3]?.toLowerCase() === "true";
      if (!msgId) {
        return message.reply(`Usage: \`${prefix}rr deletedeck <message_id> [--discord]\`
*(Add \`--discord\` to also delete the message from the channel)*`);
      }
      const mappings = await prisma.reactionRole.findMany({
        where: { guildId: guild.id, messageId: msgId }
      });
      if (mappings.length === 0) {
        return message.reply(`\u26A0\uFE0F No role deck found matching Message ID \`${msgId}\`.`);
      }
      const count = mappings.length;
      const channelId = mappings[0].channelId;
      if (deleteMsg && channelId) {
        try {
          const ch = await guild.channels.fetch(channelId).catch(() => null);
          if (ch && "messages" in ch) {
            const msg = await ch.messages.fetch(msgId).catch(() => null);
            if (msg) await msg.delete().catch(() => null);
          }
        } catch {
        }
      }
      await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id, messageId: msgId }
      });
      return message.reply(`\u{1F5D1}\uFE0F **Role Deck Deleted:** Removed all **${count}** role mapping(s) from message \`${msgId}\`${deleteMsg ? " and deleted the Discord message" : ""}!`);
    }
    if (sub === "purge" || sub === "deleteall") {
      const deleteMsgs = args[2]?.toLowerCase() === "--discord" || args[2]?.toLowerCase() === "true";
      if (deleteMsgs) {
        const distinctMessages = await prisma.reactionRole.findMany({
          where: { guildId: guild.id },
          select: { channelId: true, messageId: true },
          distinct: ["channelId", "messageId"]
        });
        for (const m of distinctMessages) {
          if (m.channelId && m.messageId) {
            try {
              const ch = await guild.channels.fetch(m.channelId).catch(() => null);
              if (ch && "messages" in ch) {
                const msg = await ch.messages.fetch(m.messageId).catch(() => null);
                if (msg) await msg.delete().catch(() => null);
              }
            } catch {
            }
          }
        }
      }
      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id }
      });
      return message.reply(`\u{1F9F9} **Purge Complete:** Successfully deleted all **${deleted.count}** reaction role mappings and decks in this server${deleteMsgs ? " and deleted their Discord messages" : ""}!`);
    }
    if (sub === "clean") {
      const all = await prisma.reactionRole.findMany({ where: { guildId: guild.id } });
      let purged = 0;
      for (const m of all) {
        if (!guild.roles.cache.has(m.roleId)) {
          await prisma.reactionRole.delete({ where: { id: m.id } });
          purged++;
        }
      }
      return message.reply(`\u{1F9F9} Cleaned up **${purged}** deleted role mapping(s).`);
    }
    if (sub === "list") {
      const all = await prisma.reactionRole.findMany({ where: { guildId: guild.id } });
      if (all.length === 0) return message.reply("No reaction roles configured yet.");
      const summary = all.map((m) => `\u2022 ${m.emoji} **${m.roleName}** (\`${m.mode || "TOGGLE"}\`)`).join("\n");
      return message.reply(`**Active Roles:**
${summary}`);
    }
  }
  if (command === "videofix") {
    if (!guild || !member) return;
    const sub = args[1]?.toLowerCase();
    if (sub === "toggle") {
      if (!isManager) return message.reply("\u26D4 You need **Manage Server** permission.");
      const config2 = await prisma.guildConfig.findUnique({ where: { id: guild.id } });
      const current = config2?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guild.id },
        data: { videoFixerEnabled: !current }
      });
      return message.reply(`\u{1F3A5} Video Fixer is now **${updated.videoFixerEnabled ? "Active" : "Disabled"}**.`);
    }
    if (sub === "deletebtn") {
      if (!isManager) return message.reply("\u26D4 You need **Manage Server** permission.");
      const val = args[2]?.toLowerCase() === "on";
      await prisma.guildConfig.update({
        where: { id: guild.id },
        data: { videoFixerDeleteButton: val }
      });
      return message.reply(`\u{1F5D1}\uFE0F Author dismiss button is now **${val ? "Enabled" : "Disabled"}**.`);
    }
    const config = await prisma.guildConfig.findUnique({ where: { id: guild.id } });
    const enabled = config?.videoFixerEnabled ?? true;
    return message.reply(
      `\u{1F3A5} **Social Video Fixer Engine:** ${enabled ? "Active \u2705" : "Disabled \u274C"}
Supported: Twitter/X, TikTok, Instagram Reels, Reddit, Bluesky, Threads`
    );
  }
  if (command === "embed") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("\u26D4 You need **Manage Server** permission.");
    const raw = content.slice(command.length).trim();
    if (raw.toLowerCase().startsWith("edit")) {
      const editRaw = raw.slice(4).trim();
      const firstSpaceIdx = editRaw.indexOf(" ");
      if (firstSpaceIdx === -1) {
        return message.reply(`Usage: \`${prefix}embed edit <message_id> <title> | <description>\``);
      }
      const msgId = editRaw.slice(0, firstSpaceIdx).trim();
      const contentRest = editRaw.slice(firstSpaceIdx).trim();
      const parts2 = contentRest.split("|");
      const title2 = parts2[0]?.trim();
      const desc2 = parts2[1]?.trim();
      if (!msgId || !title2 || !desc2) {
        return message.reply(`Usage: \`${prefix}embed edit <message_id> <title> | <description>\``);
      }
      let targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (!targetMsg) {
        for (const ch of guild.channels.cache.values()) {
          if (ch.isTextBased() && "messages" in ch) {
            targetMsg = await ch.messages.fetch(msgId).catch(() => null);
            if (targetMsg) break;
          }
        }
      }
      if (!targetMsg) {
        return message.reply(`\u274C Message \`${msgId}\` was not found. Make sure the message exists in a channel Paradox can read.`);
      }
      if (targetMsg.author.id !== message.client.user?.id) {
        return message.reply(`\u274C Paradox can only edit embed messages originally sent by Paradox itself.`);
      }
      const embed2 = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(title2).setDescription(desc2).setTimestamp();
      await targetMsg.edit({ embeds: [embed2] });
      return message.reply(`\u2705 Successfully updated embed for message \`${msgId}\`!`);
    }
    const parts = raw.split("|");
    const title = parts[0]?.trim();
    const desc = parts[1]?.trim();
    if (!title || !desc) {
      return message.reply(`Usage: \`${prefix}embed <title> | <description>\`
Or to edit: \`${prefix}embed edit <message_id> <title> | <description>\``);
    }
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(title).setDescription(desc).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }
  if (command === "dashboard") {
    return message.reply(`Manage Paradox in the web dashboard: ${appUrl}/dashboard/${guild?.id}`);
  }
}

// src/bot/services/ensureDb.ts
async function ensureDatabaseSchema(prisma2) {
  try {
    console.log("[Database] Checking and ensuring database tables exist...");
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL,
        "discriminator" TEXT,
        "avatar" TEXT,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "tokenExpiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GuildConfig" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "icon" TEXT,
        "botJoined" BOOLEAN NOT NULL DEFAULT true,
        "prefix" TEXT NOT NULL DEFAULT '$',
        "videoFixerEnabled" BOOLEAN NOT NULL DEFAULT true,
        "videoFixerProviders" TEXT NOT NULL DEFAULT '["twitter","tiktok","instagram","reddit","bluesky","threads"]',
        "videoFixerIgnoredChannels" TEXT NOT NULL DEFAULT '[]',
        "videoFixerDeleteButton" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReactionRole" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "channelId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "emoji" TEXT NOT NULL,
        "roleId" TEXT NOT NULL,
        "roleName" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'REACTION',
        "mode" TEXT NOT NULL DEFAULT 'TOGGLE',
        "requiredRoleId" TEXT,
        "imageUrl" TEXT,
        "bannerUrl" TEXT,
        "confirmGif" TEXT,
        "buttonStyle" TEXT DEFAULT 'PRIMARY',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmbedTemplate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "name" TEXT NOT NULL DEFAULT 'Untitled Embed',
        "title" TEXT,
        "description" TEXT,
        "url" TEXT,
        "color" TEXT DEFAULT '#5865F2',
        "authorName" TEXT,
        "authorUrl" TEXT,
        "authorIconUrl" TEXT,
        "footerText" TEXT,
        "footerIconUrl" TEXT,
        "timestamp" BOOLEAN NOT NULL DEFAULT false,
        "thumbnailUrl" TEXT,
        "imageUrl" TEXT,
        "fields" TEXT NOT NULL DEFAULT '[]',
        "lastPublishedChannelId" TEXT,
        "lastPublishedMessageId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      ALTER TABLE "GuildConfig" ADD COLUMN IF NOT EXISTS "videoFixerDeleteButton" BOOLEAN DEFAULT true;
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      ALTER TABLE "ReactionRole" ADD COLUMN IF NOT EXISTS "mode" TEXT DEFAULT 'TOGGLE';
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      ALTER TABLE "ReactionRole" ADD COLUMN IF NOT EXISTS "requiredRoleId" TEXT;
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReactionRole_guildId_idx" ON "ReactionRole"("guildId");
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReactionRole_messageId_idx" ON "ReactionRole"("messageId");
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EmbedTemplate_guildId_idx" ON "EmbedTemplate"("guildId");
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AuditLog_guildId_idx" ON "AuditLog"("guildId");
    `).catch(() => null);
    console.log("[Database] Specialist tables and indexes are ready!");
  } catch (err) {
    console.error("[Database] Automatic schema verification warning:", err);
  }
}

// src/bot/events/ready.ts
async function onReady(client) {
  if (!client.user) return;
  console.log(`[Bot] Successfully connected to Discord Gateway as ${client.user.tag} (ID: ${client.user.id})`);
  client.user.setActivity("Managing servers & video embeds", { type: import_discord3.ActivityType.Custom });
  try {
    if (client.application) {
      console.log(`[Bot] Registering slash commands globally with Discord...`);
      await client.application.commands.set(SLASH_COMMANDS_DATA);
      console.log(`[Bot] Successfully registered ${SLASH_COMMANDS_DATA.length} global slash commands!`);
      const connectedGuilds = await client.guilds.fetch().catch(() => null);
      if (connectedGuilds) {
        for (const [gId, oauthGuild] of connectedGuilds) {
          try {
            const guildObj = await oauthGuild.fetch();
            await guildObj.commands.set(SLASH_COMMANDS_DATA);
            console.log(`[Bot] \u26A1 Instant slash commands deployed to: "${guildObj.name}"`);
          } catch (gErr) {
            console.warn(`[Bot] Could not push instant commands to "${oauthGuild.name}": ${gErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Bot] Failed to register slash commands:", err);
  }
  await ensureDatabaseSchema(prisma);
  try {
    const guilds = await client.guilds.fetch();
    console.log(`[Bot] Synchronizing ${guilds.size} connected guild(s) with database...`);
    for (const oauthGuild of Array.from(guilds.values())) {
      await prisma.guildConfig.upsert({
        where: { id: oauthGuild.id },
        update: {
          name: oauthGuild.name,
          icon: oauthGuild.icon,
          botJoined: true
        },
        create: {
          id: oauthGuild.id,
          name: oauthGuild.name,
          icon: oauthGuild.icon,
          botJoined: true
        }
      });
    }
    console.log(`[Bot] Guild synchronization complete.`);
  } catch (err) {
    console.error("[Bot] Failed to sync guilds on ready:", err);
  }
}

// src/bot/events/messageCreate.ts
var import_discord4 = require("discord.js");

// src/bot/services/videoTransformer.ts
function extractAndTransformVideoUrls(content, enabledProviders = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"]) {
  if (!content || typeof content !== "string") return [];
  const results = [];
  const activeProviders = new Set(enabledProviders);
  const urlRegex = /(?<!<)\bhttps?:\/\/[^\s<>]+(?!\>)/gi;
  const matches = content.match(urlRegex);
  if (!matches) return [];
  for (const rawUrl of matches) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;
      if (activeProviders.has("twitter")) {
        const isTwitter = host === "twitter.com" || host === "www.twitter.com" || host === "x.com" || host === "www.x.com";
        const isAlreadyTransformed = host.includes("fxtwitter") || host.includes("vxtwitter") || host.includes("fixupx");
        if (isTwitter && !isAlreadyTransformed) {
          const statusMatch = pathname.match(/^\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/);
          if (statusMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "fxtwitter.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "twitter"
            });
            continue;
          }
        }
      }
      if (activeProviders.has("tiktok")) {
        const isStandardTikTok = host === "tiktok.com" || host === "www.tiktok.com";
        const isShortTikTok = host === "vm.tiktok.com" || host === "vt.tiktok.com";
        const isAlreadyTransformed = host.includes("tiktxk") || host.includes("vxtiktok");
        if (!isAlreadyTransformed) {
          if (isStandardTikTok && (pathname.includes("/video/") || pathname.includes("/photo/"))) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "tiktxk.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "tiktok"
            });
            continue;
          } else if (isShortTikTok && pathname.length > 1) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "tiktxk.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "tiktok"
            });
            continue;
          }
        }
      }
      if (activeProviders.has("instagram")) {
        const isInstagram = host === "instagram.com" || host === "www.instagram.com";
        const isAlreadyTransformed = host.includes("fxinstagram") || host.includes("ddinstagram") || host.includes("vxinstagram");
        if (isInstagram && !isAlreadyTransformed) {
          const instaMatch = pathname.match(/^\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
          if (instaMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "fxinstagram.com";
            transformed.search = "";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "instagram"
            });
            continue;
          }
        }
      }
      if (activeProviders.has("reddit")) {
        const isReddit = host === "reddit.com" || host === "www.reddit.com" || host === "old.reddit.com";
        const isAlreadyTransformed = host.includes("rxddit");
        if (isReddit && !isAlreadyTransformed) {
          const redditMatch = pathname.match(/^\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)/);
          if (redditMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "rxddit.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "reddit"
            });
            continue;
          }
        }
      }
      if (activeProviders.has("bluesky")) {
        const isBluesky = host === "bsky.app" || host === "www.bsky.app";
        const isAlreadyTransformed = host.includes("bskyx.app") || host.includes("fxbsky");
        if (isBluesky && !isAlreadyTransformed && pathname.includes("/post/")) {
          const transformed = new URL(rawUrl);
          transformed.hostname = "bskyx.app";
          results.push({
            originalUrl: rawUrl,
            transformedUrl: transformed.toString(),
            provider: "bluesky"
          });
          continue;
        }
      }
      if (activeProviders.has("threads")) {
        const isThreads = host === "threads.net" || host === "www.threads.net";
        const isAlreadyTransformed = host.includes("fixthreads");
        if (isThreads && !isAlreadyTransformed && pathname.includes("/post/")) {
          const transformed = new URL(rawUrl);
          transformed.hostname = "fixthreads.net";
          results.push({
            originalUrl: rawUrl,
            transformedUrl: transformed.toString(),
            provider: "threads"
          });
          continue;
        }
      }
    } catch {
      continue;
    }
  }
  return results;
}

// src/bot/events/messageCreate.ts
async function onMessageCreate(message) {
  if (message.author.bot || message.webhookId) return;
  if (!message.guild || !("send" in message.channel)) return;
  const guildId = message.guild.id;
  const channelId = message.channel.id;
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId }
    }).catch(() => null);
    const prefix = config?.prefix || "$";
    const isCustomPrefix = message.content.startsWith(prefix);
    const isFallbackPrefix = message.content.startsWith("$") || message.content.startsWith("!") || message.content.startsWith(".");
    const usedPrefix = isCustomPrefix ? prefix : isFallbackPrefix ? message.content[0] : null;
    if (usedPrefix) {
      await handleTextCommand(message, usedPrefix);
      return;
    }
    if (!config || !config.videoFixerEnabled) return;
    let ignoredChannels = [];
    try {
      ignoredChannels = JSON.parse(config.videoFixerIgnoredChannels || "[]");
    } catch {
      ignoredChannels = [];
    }
    if (ignoredChannels.includes(channelId)) return;
    let enabledProviders = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"];
    try {
      if (config.videoFixerProviders) {
        enabledProviders = JSON.parse(config.videoFixerProviders);
      }
    } catch {
      enabledProviders = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"];
    }
    if (enabledProviders.length === 0) return;
    const transformedLinks = extractAndTransformVideoUrls(message.content, enabledProviders);
    if (transformedLinks.length === 0) return;
    const linksList = transformedLinks.map((t) => t.transformedUrl).join("\n");
    const replyText = `\u{1F3A5} **Enhanced Video Embed** (shared by <@${message.author.id}>):
${linksList}`;
    const sendPayload = {
      content: replyText,
      allowedMentions: { users: [] }
    };
    if (config.videoFixerDeleteButton !== false) {
      const row = new import_discord4.ActionRowBuilder().addComponents(
        new import_discord4.ButtonBuilder().setCustomId(`rr_del_video_${message.author.id}`).setLabel("Dismiss Preview").setEmoji("\u{1F5D1}\uFE0F").setStyle(import_discord4.ButtonStyle.Secondary)
      );
      sendPayload.components = [row];
    }
    await message.channel.send(sendPayload);
    const botMember = message.guild.members.me;
    if (botMember && botMember.permissionsIn(message.channel.id).has(import_discord4.PermissionFlagsBits.ManageMessages)) {
      await message.suppressEmbeds(true).catch(() => null);
    }
  } catch (err) {
    console.error(`[Bot:MessageCreate] Error processing message in guild ${guildId}:`, err);
  }
}

// src/bot/services/reactionRoleService.ts
function normalizeEmoji(reaction) {
  if (reaction.emoji.id) {
    return `${reaction.emoji.name}:${reaction.emoji.id}`;
  }
  return reaction.emoji.name || "";
}
async function handleReactionAdd(reaction, user) {
  if (user.bot) return { success: false, action: "skipped", error: "User is bot" };
  const message = reaction.message;
  const guild = message.guild;
  if (!guild) return { success: false, action: "skipped", error: "Not in a guild" };
  const emojiKey = normalizeEmoji(reaction);
  try {
    const mapping = await prisma.reactionRole.findFirst({
      where: {
        guildId: guild.id,
        messageId: message.id,
        emoji: emojiKey
      }
    });
    if (!mapping) {
      return { success: false, action: "skipped", error: "No mapping found" };
    }
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return { success: false, action: "skipped", error: "Guild member not found" };
    }
    const role = await guild.roles.fetch(mapping.roleId).catch(() => null);
    if (!role) {
      console.warn(`[ReactionRoles] Role ${mapping.roleId} not found in guild ${guild.id}.`);
      return { success: false, action: "skipped", error: "Role deleted or not found" };
    }
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember) {
      return { success: false, action: "skipped", error: "Bot member not found" };
    }
    if (!botMember.permissions.has("ManageRoles")) {
      console.warn(`[ReactionRoles] Bot is missing 'Manage Roles' permission in ${guild.name} (${guild.id})`);
      return { success: false, action: "skipped", error: "Bot lacks Manage Roles permission" };
    }
    if (role.position >= botMember.roles.highest.position) {
      console.warn(
        `[ReactionRoles] Role hierarchy violation: ${role.name} (${role.position}) >= bot highest role (${botMember.roles.highest.position})`
      );
      return {
        success: false,
        action: "skipped",
        error: "Target role is higher than or equal to bot's highest role"
      };
    }
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role, "Reaction role assigned");
      return { success: true, action: "added", roleName: role.name };
    }
    return { success: true, action: "skipped", roleName: role.name };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ReactionRoles] Error assigning role: ${errorMsg}`);
    return { success: false, action: "skipped", error: errorMsg };
  }
}
async function handleReactionRemove(reaction, user) {
  if (user.bot) return { success: false, action: "skipped", error: "User is bot" };
  const message = reaction.message;
  const guild = message.guild;
  if (!guild) return { success: false, action: "skipped", error: "Not in a guild" };
  const emojiKey = normalizeEmoji(reaction);
  try {
    const mapping = await prisma.reactionRole.findFirst({
      where: {
        guildId: guild.id,
        messageId: message.id,
        emoji: emojiKey
      }
    });
    if (!mapping) return { success: false, action: "skipped", error: "No mapping found" };
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return { success: false, action: "skipped", error: "Guild member not found" };
    const role = await guild.roles.fetch(mapping.roleId).catch(() => null);
    if (!role) return { success: false, action: "skipped", error: "Role not found" };
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has("ManageRoles")) {
      return { success: false, action: "skipped", error: "Bot lacks Manage Roles permission" };
    }
    if (role.position >= botMember.roles.highest.position) {
      return {
        success: false,
        action: "skipped",
        error: "Target role is higher than or equal to bot's highest role"
      };
    }
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role, "Reaction role removed");
      return { success: true, action: "removed", roleName: role.name };
    }
    return { success: true, action: "skipped", roleName: role.name };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ReactionRoles] Error removing role: ${errorMsg}`);
    return { success: false, action: "skipped", error: errorMsg };
  }
}

// src/bot/events/messageReactionAdd.ts
async function onMessageReactionAdd(reaction, user) {
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }
    if (user.bot) return;
    await handleReactionAdd(reaction, user);
  } catch (err) {
    console.error("[Bot:ReactionAdd] Error handling reaction add:", err);
  }
}

// src/bot/events/messageReactionRemove.ts
async function onMessageReactionRemove(reaction, user) {
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }
    if (user.bot) return;
    await handleReactionRemove(reaction, user);
  } catch (err) {
    console.error("[Bot:ReactionRemove] Error handling reaction remove:", err);
  }
}

// src/bot/events/interactionCreate.ts
var import_discord5 = require("discord.js");
async function onInteractionCreate(interaction) {
  if (interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand()) {
    await handleSlashCommand(interaction).catch((err) => {
      console.error("[Bot:SlashCommand] Error executing command:", err);
    });
    return;
  }
  if (!interaction.inGuild() || !interaction.guild) return;
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("rr_del_video_")) {
      const authorId = interaction.customId.replace("rr_del_video_", "");
      const isAuthor = interaction.user.id === authorId;
      const isMod = interaction.memberPermissions?.has(import_discord5.PermissionsBitField.Flags.ManageMessages) || interaction.memberPermissions?.has(import_discord5.PermissionsBitField.Flags.Administrator);
      if (isAuthor || isMod) {
        await interaction.message.delete().catch(() => null);
        return;
      } else {
        return interaction.reply({
          content: "\u274C Only the author who shared this link or server moderators can dismiss this preview.",
          ephemeral: true
        });
      }
    }
    if (interaction.customId.startsWith("rr_role_")) {
      const roleId = interaction.customId.replace("rr_role_", "");
      await handleRoleToggle(interaction, roleId);
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith("rr_select_")) {
      const selectedRoleId = interaction.values[0];
      if (selectedRoleId) {
        await handleRoleToggle(interaction, selectedRoleId);
      }
    }
  }
}
async function handleRoleToggle(interaction, roleId) {
  try {
    const guild = interaction.guild;
    const member = interaction.member;
    if (!member || !guild) {
      return interaction.reply({
        content: "Could not retrieve your server member profile.",
        ephemeral: true
      });
    }
    const role = await guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      return interaction.reply({
        content: "\u26A0\uFE0F The selected role no longer exists in this server.",
        ephemeral: true
      });
    }
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has(import_discord5.PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: "\u26A0\uFE0F The bot lacks the **Manage Roles** permission to assign this role.",
        ephemeral: true
      });
    }
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content: `\u26A0\uFE0F Role Hierarchy Conflict: **${role.name}** is positioned higher than or equal to the bot's highest role. An administrator must move the bot's role above **${role.name}**.`,
        ephemeral: true
      });
    }
    const messageId = interaction.message?.id;
    let mapping = null;
    if (messageId) {
      mapping = await prisma.reactionRole.findFirst({
        where: {
          guildId: guild.id,
          roleId: role.id,
          messageId
        }
      });
    }
    if (!mapping) {
      mapping = await prisma.reactionRole.findFirst({
        where: {
          guildId: guild.id,
          roleId: role.id
        }
      });
    }
    const mode = mapping?.mode || "TOGGLE";
    if (mapping?.requiredRoleId && !member.roles.cache.has(mapping.requiredRoleId)) {
      return interaction.reply({
        content: `\u{1F512} **Prerequisite Required:** You must have the <@&${mapping.requiredRoleId}> role before you can claim **${role.name}**.`,
        ephemeral: true
      });
    }
    const hasRole = member.roles.cache.has(role.id);
    if (mode === "VERIFY") {
      if (hasRole) {
        return interaction.reply({
          content: `\u2705 You have already verified and claimed the **${role.name}** role.`,
          ephemeral: true
        });
      }
      await member.roles.add(role, "Paradox Verification role claim");
      return sendRoleClaimResponse(interaction, role, mapping);
    }
    if (mode === "REVERSED") {
      if (hasRole) {
        await member.roles.remove(role, "Paradox Reversed role unclaim");
        return sendRoleRemoveResponse(interaction, role, mapping);
      } else {
        return interaction.reply({
          content: `\u2139\uFE0F You do not currently have the **${role.name}** role.`,
          ephemeral: true
        });
      }
    }
    if (mode === "UNIQUE") {
      if (hasRole) {
        await member.roles.remove(role, "Paradox Unique role toggle");
        return sendRoleRemoveResponse(interaction, role, mapping);
      } else {
        const removedNames = [];
        const targetMessageId = mapping?.messageId || interaction.message?.id;
        if (targetMessageId) {
          const siblingMappings = await prisma.reactionRole.findMany({
            where: {
              guildId: guild.id,
              messageId: targetMessageId,
              roleId: { not: role.id }
            }
          });
          for (const sib of siblingMappings) {
            if (member.roles.cache.has(sib.roleId)) {
              const sibRole = guild.roles.cache.get(sib.roleId) || await guild.roles.fetch(sib.roleId).catch(() => null);
              if (sibRole) removedNames.push(sibRole.name);
              await member.roles.remove(sib.roleId, "Paradox Unique mode swap").catch(() => null);
            }
          }
        }
        if (interaction.message?.components) {
          for (const row of interaction.message.components) {
            if ("components" in row && Array.isArray(row.components)) {
              for (const comp of row.components) {
                if (comp.customId && comp.customId.startsWith("rr_role_")) {
                  const compRoleId = comp.customId.replace("rr_role_", "");
                  if (compRoleId !== role.id && member.roles.cache.has(compRoleId)) {
                    const sibRole = guild.roles.cache.get(compRoleId) || await guild.roles.fetch(compRoleId).catch(() => null);
                    if (sibRole && !removedNames.includes(sibRole.name)) {
                      removedNames.push(sibRole.name);
                    }
                    await member.roles.remove(compRoleId, "Paradox Unique mode swap").catch(() => null);
                  }
                }
              }
            }
          }
        }
        await member.roles.add(role, "Paradox Unique mode claim");
        return sendRoleClaimResponse(interaction, role, mapping, removedNames);
      }
    }
    if (hasRole) {
      await member.roles.remove(role, "Visual Role Deck unclaim");
      return sendRoleRemoveResponse(interaction, role, mapping);
    } else {
      await member.roles.add(role, "Visual Role Deck claim");
      return sendRoleClaimResponse(interaction, role, mapping);
    }
  } catch (err) {
    console.error("[Bot:RoleInteraction] Error toggling role:", err);
    if (!interaction.replied) {
      return interaction.reply({
        content: "An unexpected error occurred while processing your role selection.",
        ephemeral: true
      });
    }
  }
}
async function sendRoleClaimResponse(interaction, role, mapping, removedNames) {
  let descriptionText = `You have successfully equipped the **${role.name}** role.`;
  if (removedNames && removedNames.length > 0) {
    descriptionText = `\u2728 Equipped **${role.name}**!

\u{1F504} Revoked previous role: **${removedNames.join(", ")}**`;
  } else if (mapping?.description) {
    descriptionText = `You received the **${role.name}** role!

**Perks & Details:**
${mapping.description}`;
  }
  const addEmbed = new import_discord5.EmbedBuilder().setColor(role.color || 5793266).setTitle(`\u2728 Role Equipped: ${role.name}`).setDescription(descriptionText).setTimestamp();
  if (mapping?.imageUrl) {
    addEmbed.setThumbnail(mapping.imageUrl);
  }
  if (mapping?.confirmGif) {
    addEmbed.setImage(mapping.confirmGif);
  } else if (mapping?.imageUrl && !mapping?.confirmGif) {
    addEmbed.setImage(mapping.imageUrl);
  }
  return interaction.reply({
    embeds: [addEmbed],
    ephemeral: true
  });
}
async function sendRoleRemoveResponse(interaction, role, mapping) {
  const removeEmbed = new import_discord5.EmbedBuilder().setColor(15548997).setTitle(`Role Removed: ${role.name}`).setDescription(`You have removed the **${role.name}** role from your profile.`).setTimestamp();
  if (mapping?.imageUrl) {
    removeEmbed.setThumbnail(mapping.imageUrl);
  }
  return interaction.reply({
    embeds: [removeEmbed],
    ephemeral: true
  });
}

// src/bot/events/guildMemberAdd.ts
var import_discord6 = require("discord.js");
async function onGuildMemberAdd(member) {
  if (member.user.bot) return;
  const guildId = member.guild.id;
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId }
    }).catch(() => null);
    if (!config) return;
    const userPfp = member.user.displayAvatarURL({ extension: "png", size: 256 });
    const userDisplayName = member.displayName || member.user.globalName || member.user.username;
    const userName = member.user.username;
    const userMention = `<@${member.id}>`;
    const serverName = member.guild.name;
    const memberCount = String(member.guild.memberCount);
    const serverIcon = member.guild.iconURL({ extension: "png", size: 256 }) || "https://cdn.discordapp.com/embed/avatars/0.png";
    const replaceTags = (text) => {
      if (!text) return "";
      let s = text.replace(/{user\.mention}/g, userMention).replace(/{user\.displayName}/gi, userDisplayName).replace(/{user\.display_name}/gi, userDisplayName).replace(/{user\.name}/g, userDisplayName).replace(/{user\.username}/g, userName).replace(/{user\.tag}/g, `@${userName}`).replace(/{user\.handle}/g, `@${userName}`).replace(/{user\.avatar}/g, userPfp).replace(/{user\.pfp}/g, userPfp).replace(/{user\.id}/g, member.id).replace(/{server\.name}/g, serverName).replace(/{server\.member_count}/g, memberCount).replace(/{server\.icon}/g, serverIcon);
      for (const [, ch] of member.guild.channels.cache) {
        if (!ch) continue;
        const escaped = ch.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`\\{#[ ]*${escaped}[ ]*\\}`, "gi");
        s = s.replace(regex, `<#${ch.id}>`);
      }
      if (/\{#[^}]+\}/.test(s)) {
        const findChannel = (kw) => member.guild.channels.cache.find(
          (c) => c.isTextBased() && c.name.toLowerCase().includes(kw.toLowerCase())
        );
        const rulesCh = findChannel("rule");
        if (rulesCh) s = s.replace(/\{#[ ]*rules[^}]*[ ]*\}/gi, `<#${rulesCh.id}>`);
        const rolesCh = findChannel("role");
        if (rolesCh) s = s.replace(/\{#[ ]*roles[^}]*[ ]*\}/gi, `<#${rolesCh.id}>`);
        const chatCh = findChannel("chat") || findChannel("general");
        if (chatCh) s = s.replace(/\{#[ ]*(general|chat)[^}]*[ ]*\}/gi, `<#${chatCh.id}>`);
        const announceCh = findChannel("announc");
        if (announceCh) s = s.replace(/\{#[ ]*announc[^}]*[ ]*\}/gi, `<#${announceCh.id}>`);
        s = s.replace(/\{#(\d+)\}/g, "<#$1>");
      }
      return s;
    };
    if (config.welcomeRoleId) {
      await member.roles.add(config.welcomeRoleId).catch((err) => {
        console.warn(`[Bot:Welcome] Failed to assign auto-role ${config.welcomeRoleId} to ${member.user.tag}:`, err.message);
      });
    }
    if (config.welcomeEnabled && config.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(config.welcomeChannelId);
      if (channel && channel.isTextBased()) {
        const messageContent = config.welcomeMessage ? replaceTags(config.welcomeMessage) : void 0;
        let embed = void 0;
        if (config.welcomeEmbed) {
          try {
            const raw = JSON.parse(config.welcomeEmbed);
            embed = new import_discord6.EmbedBuilder();
            if (raw.title) {
              let titleHeader = replaceTags(raw.title);
              titleHeader = titleHeader.replace(/<@!?\d+>/g, `@${userDisplayName}`);
              embed.setTitle(titleHeader);
            }
            if (raw.description) embed.setDescription(replaceTags(raw.description));
            if (raw.color) {
              embed.setColor(parseInt(raw.color.replace("#", ""), 16) || 5793266);
            } else {
              embed.setColor(5793266);
            }
            if (raw.authorName) {
              let authorHeader = replaceTags(raw.authorName);
              authorHeader = authorHeader.replace(/<@!?\d+>/g, `@${userDisplayName}`);
              embed.setAuthor({
                name: authorHeader,
                iconURL: raw.authorIconUrl ? replaceTags(raw.authorIconUrl) : userPfp
              });
            }
            if (raw.thumbnailUrl) {
              const thumb = replaceTags(raw.thumbnailUrl);
              if (thumb.includes("http")) embed.setThumbnail(thumb);
            }
            if (raw.imageUrl) {
              const img = replaceTags(raw.imageUrl);
              if (img.includes("http")) embed.setImage(img);
            }
            if (raw.footerText) {
              embed.setFooter({
                text: replaceTags(raw.footerText),
                iconURL: raw.footerIconUrl ? replaceTags(raw.footerIconUrl) : void 0
              });
            }
            if (raw.fields && Array.isArray(raw.fields) && raw.fields.length > 0) {
              const validFields = raw.fields.map((f) => ({
                name: (replaceTags(f.name) || f.name || "Field").slice(0, 256),
                value: (replaceTags(f.value) || f.value || "\u2014").slice(0, 1024),
                inline: Boolean(f.inline)
              })).filter((f) => f.name.trim().length > 0 && f.value.trim().length > 0);
              if (validFields.length > 0) {
                embed.addFields(validFields);
              }
            }
            if (raw.timestamp) {
              embed.setTimestamp();
            }
          } catch (err) {
            console.error("[Bot:Welcome] Error parsing welcome embed:", err);
          }
        }
        if (messageContent || embed) {
          await channel.send({
            content: messageContent || void 0,
            embeds: embed ? [embed] : void 0
          }).catch((err) => {
            console.error(`[Bot:Welcome] Failed to send welcome message to #${channel.name}:`, err.message);
          });
        }
      }
    }
    if (config.welcomeDmEnabled && config.welcomeDmMessage) {
      const dmText = replaceTags(config.welcomeDmMessage);
      await member.send(dmText).catch(() => {
      });
    }
  } catch (err) {
    console.error("[Bot:Welcome] Error processing guildMemberAdd:", err);
  }
}

// src/bot/events/guildMemberRemove.ts
var import_discord7 = require("discord.js");
async function onGuildMemberRemove(member) {
  if (member.user?.bot) return;
  const guildId = member.guild.id;
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId }
    }).catch(() => null);
    if (!config || !config.goodbyeEnabled || !config.goodbyeChannelId) return;
    const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
    if (!channel || !channel.isTextBased()) return;
    const userPfp = member.user ? member.user.displayAvatarURL({ extension: "png", size: 256 }) : "https://cdn.discordapp.com/embed/avatars/0.png";
    const userDisplayName = member.displayName || member.user?.globalName || member.user?.username || "A member";
    const userName = member.user?.username || "A member";
    const serverName = member.guild.name;
    const memberCount = String(member.guild.memberCount);
    const serverIcon = member.guild.iconURL({ extension: "png", size: 256 }) || "https://cdn.discordapp.com/embed/avatars/0.png";
    const replaceTags = (text) => {
      if (!text) return "";
      let s = text.replace(/{user\.mention}/g, `@${userDisplayName}`).replace(/{user\.displayName}/gi, userDisplayName).replace(/{user\.display_name}/gi, userDisplayName).replace(/{user\.name}/g, userDisplayName).replace(/{user\.username}/g, userName).replace(/{user\.tag}/g, `@${userName}`).replace(/{user\.handle}/g, `@${userName}`).replace(/{user\.avatar}/g, userPfp).replace(/{user\.pfp}/g, userPfp).replace(/{user\.id}/g, member.id).replace(/{server\.name}/g, serverName).replace(/{server\.member_count}/g, memberCount).replace(/{server\.icon}/g, serverIcon);
      for (const [, ch] of member.guild.channels.cache) {
        if (!ch) continue;
        const escaped = ch.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`\\{#[ ]*${escaped}[ ]*\\}`, "gi");
        s = s.replace(regex, `<#${ch.id}>`);
      }
      if (/\{#[^}]+\}/.test(s)) {
        const findChannel = (kw) => member.guild.channels.cache.find(
          (c) => c.isTextBased() && c.name.toLowerCase().includes(kw.toLowerCase())
        );
        const rulesCh = findChannel("rule");
        if (rulesCh) s = s.replace(/\{#[ ]*rules[^}]*[ ]*\}/gi, `<#${rulesCh.id}>`);
        const chatCh = findChannel("chat") || findChannel("general");
        if (chatCh) s = s.replace(/\{#[ ]*(general|chat)[^}]*[ ]*\}/gi, `<#${chatCh.id}>`);
        s = s.replace(/\{#(\d+)\}/g, "<#$1>");
      }
      return s;
    };
    const messageContent = config.goodbyeMessage ? replaceTags(config.goodbyeMessage) : void 0;
    let embed = void 0;
    if (config.goodbyeEmbed) {
      try {
        const raw = JSON.parse(config.goodbyeEmbed);
        embed = new import_discord7.EmbedBuilder();
        if (raw.title) {
          let titleHeader = replaceTags(raw.title);
          titleHeader = titleHeader.replace(/<@!?\d+>/g, `@${userDisplayName}`);
          embed.setTitle(titleHeader);
        }
        if (raw.description) embed.setDescription(replaceTags(raw.description));
        if (raw.color) {
          embed.setColor(parseInt(raw.color.replace("#", ""), 16) || 14300988);
        } else {
          embed.setColor(14300988);
        }
        if (raw.authorName) {
          let authorHeader = replaceTags(raw.authorName);
          authorHeader = authorHeader.replace(/<@!?\d+>/g, `@${userDisplayName}`);
          embed.setAuthor({
            name: authorHeader,
            iconURL: raw.authorIconUrl ? replaceTags(raw.authorIconUrl) : userPfp
          });
        }
        if (raw.thumbnailUrl) {
          const thumb = replaceTags(raw.thumbnailUrl);
          if (thumb.includes("http")) embed.setThumbnail(thumb);
        }
        if (raw.imageUrl) {
          const img = replaceTags(raw.imageUrl);
          if (img.includes("http")) embed.setImage(img);
        }
        if (raw.footerText) {
          embed.setFooter({
            text: replaceTags(raw.footerText),
            iconURL: raw.footerIconUrl ? replaceTags(raw.footerIconUrl) : void 0
          });
        }
        if (raw.fields && Array.isArray(raw.fields) && raw.fields.length > 0) {
          const validFields = raw.fields.map((f) => ({
            name: (replaceTags(f.name) || f.name || "Field").slice(0, 256),
            value: (replaceTags(f.value) || f.value || "\u2014").slice(0, 1024),
            inline: Boolean(f.inline)
          })).filter((f) => f.name.trim().length > 0 && f.value.trim().length > 0);
          if (validFields.length > 0) {
            embed.addFields(validFields);
          }
        }
        if (raw.timestamp) {
          embed.setTimestamp();
        }
      } catch (err) {
        console.error("[Bot:Goodbye] Error parsing goodbye embed:", err);
      }
    }
    if (messageContent || embed) {
      await channel.send({
        content: messageContent || void 0,
        embeds: embed ? [embed] : void 0
      }).catch((err) => {
        console.error(`[Bot:Goodbye] Failed to send goodbye message to #${channel.name}:`, err.message);
      });
    }
  } catch (err) {
    console.error("[Bot:Goodbye] Error processing guildMemberRemove:", err);
  }
}

// src/bot/index.ts
import_dotenv.default.config();
async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || token === "your_discord_bot_token_here" || token.startsWith("dummy_")) {
    console.warn("\n=======================================================");
    console.warn("\u26A0\uFE0F  [Bot] DISCORD_BOT_TOKEN is not configured or is a placeholder.");
    console.warn("\u26A0\uFE0F  The Discord Bot client cannot connect to the gateway.");
    console.warn("\u26A0\uFE0F  Please set a valid bot token in your .env file to enable live Discord events.");
    console.warn("=======================================================\n");
    return null;
  }
  const client = createBotClient();
  client.once("ready", () => onReady(client));
  client.on("messageCreate", onMessageCreate);
  client.on("messageReactionAdd", onMessageReactionAdd);
  client.on("messageReactionRemove", onMessageReactionRemove);
  client.on("interactionCreate", onInteractionCreate);
  client.on("guildMemberAdd", onGuildMemberAdd);
  client.on("guildMemberRemove", onGuildMemberRemove);
  client.on("error", (error) => {
    console.error("[Bot] Discord client error encountered:", error.message);
  });
  client.on("warn", (warning) => {
    console.warn("[Bot] Discord client warning:", warning);
  });
  client.on("shardDisconnect", (event, shardId) => {
    console.warn(`[Bot] Shard ${shardId} disconnected with code ${event.code}. Discord.js will attempt reconnection...`);
  });
  client.on("shardReconnecting", (shardId) => {
    console.log(`[Bot] Shard ${shardId} reconnecting to Discord Gateway...`);
  });
  client.on("shardResume", (shardId, replayedEvents) => {
    console.log(`[Bot] Shard ${shardId} resumed connection. Replayed ${replayedEvents} events.`);
  });
  try {
    await client.login(token);
    return client;
  } catch (error) {
    console.error("[Bot] Failed to log in with provided DISCORD_BOT_TOKEN:", error);
    return null;
  }
}
if (require.main === module) {
  startBot().catch((err) => {
    console.error("[Bot] Fatal startup error:", err);
    process.exit(1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SLASH_COMMANDS_DATA,
  startBot
});
