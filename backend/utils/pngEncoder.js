import zlib from 'node:zlib';

/**
 * Lightweight pure-JavaScript PNG encoder using Node's native zlib.
 * Generates RGBA PNG buffers from raw pixel arrays without any external C++ bindings.
 */
export function createPngBuffer(width, height, rgbaBuffer) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // Deflate compression
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method (none)

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None) at the start of each line
  const scanlineLength = width * 4;
  const rawData = Buffer.alloc(height * (scanlineLength + 1));

  for (let y = 0; y < height; y++) {
    const rawOffset = y * (scanlineLength + 1);
    rawData[rawOffset] = 0; // Filter byte: None
    const srcOffset = y * scanlineLength;
    rgbaBuffer.copy(rawData, rawOffset + 1, srcOffset, srcOffset + scanlineLength);
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(length + 12);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // CRC32 over type + data
  const crcTarget = Buffer.alloc(length + 4);
  chunk.copy(crcTarget, 0, 4, 8 + length);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc >>> 0, 8 + length);

  return chunk;
}

// Precomputed CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

