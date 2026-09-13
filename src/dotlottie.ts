// dotLottie 2.0 (.lottie): a zip holding manifest.json and a/<id>.json.
// ponytail: images stay base64 inside the JSON rather than moving to i/; deflate
// already claws back most of base64's overhead.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});

export const crc32 = (data: Uint8Array) => {
  let c = ~0;
  for (const b of data) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};

// little-endian [value, byteSize] fields, as zip headers are laid out
const fields = (...values: [number, 2 | 4][]) => {
  const out = new Uint8Array(values.reduce((sum, [, size]) => sum + size, 0));
  const view = new DataView(out.buffer);
  let at = 0;
  for (const [value, size] of values) {
    if (size === 2) view.setUint16(at, value, true);
    else view.setUint32(at, value, true);
    at += size;
  }
  return out;
};

const deflateRaw = async (data: Uint8Array) =>
  new Uint8Array(
    await new Response(
      new Blob([data]).stream().pipeThrough(new CompressionStream("deflate-raw"))
    ).arrayBuffer()
  );

export async function zip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  const DOS_DATE = 0x21; // 1980-01-01, the zip epoch

  for (const [name, text] of Object.entries(files)) {
    const raw = encoder.encode(text);
    const data = await deflateRaw(raw);
    const nameBytes = encoder.encode(name);
    const common: [number, 2 | 4][] = [
      [20, 2], [0, 2], [8, 2], [0, 2], [DOS_DATE, 2], // version, flags, deflate, time, date
      [crc32(raw), 4], [data.length, 4], [raw.length, 4],
      [nameBytes.length, 2], [0, 2], // name length, extra length
    ];
    const local = fields([0x04034b50, 4], ...common);
    // central record: version made by, the shared fields, comment/disk/attrs, offset
    directory.push(
      fields([0x02014b50, 4], [20, 2], ...common, [0, 2], [0, 2], [0, 2], [0, 4], [offset, 4]),
      nameBytes
    );
    parts.push(local, nameBytes, data);
    offset += local.length + nameBytes.length + data.length;
  }

  const directorySize = directory.reduce((sum, e) => sum + e.length, 0);
  const count = Object.keys(files).length;
  const end = fields([0x06054b50, 4], [0, 2], [0, 2], [count, 2], [count, 2], [directorySize, 4], [offset, 4], [0, 2]);
  return new Blob([...parts, ...directory, end], { type: "application/zip+dotlottie" });
}

export const dotLottie = (animationJson: string, id = "animation") =>
  zip({
    "manifest.json": JSON.stringify({ version: "2", generator: "p5js-to-lottie", animations: [{ id }] }),
    [`a/${id}.json`]: animationJson,
  });
