import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export function vanity(
  prefix = "",
  suffix = "",
  cpu = navigator.hardwareConcurrency || 2,
  caseSensitive = false,
  onProgress = null
) {
  let total = 0;
  const start = performance.now();
  const workers = [];

  const workerCode = `
    import { Keypair } from "https://esm.sh/@solana/web3.js";
    import bs58 from "https://esm.sh/bs58";

    self.onmessage = (e)=>{
      const { prefix, suffix, caseSensitive } = e.data;

      const normPrefix = caseSensitive ? prefix : prefix.toLowerCase();
      const normSuffix = caseSensitive ? suffix : suffix.toLowerCase();

      let batch = 0;

      while(true){
        batch++;

        const kp = Keypair.generate();
        const addr = kp.publicKey.toBase58();
        const compareAddr = caseSensitive ? addr : addr.toLowerCase();

        const prefixMatch = !normPrefix || compareAddr.startsWith(normPrefix);
        const suffixMatch = !normSuffix || compareAddr.endsWith(normSuffix);

        if(prefixMatch && suffixMatch){
          const priv = bs58.encode(kp.secretKey);
          self.postMessage({f:1,a:addr,p:priv,n:batch});
          break;
        }

        if(batch>=400 + Math.random() * 200){
          self.postMessage({n:batch});
          batch=0;
        }
      }
    };
  `;

  const blobURL = URL.createObjectURL(
    new Blob([workerCode], { type: "text/javascript" })
  );

  return new Promise((resolve, reject) => {
    if (onProgress) onProgress(0);

    const interval = setInterval(() => {
      if (onProgress) onProgress(total);
    }, 20);

    for (let i = 0; i < cpu; i++) {
      const w = new Worker(blobURL, { type: "module" });
      workers.push(w);

      w.postMessage({ prefix, suffix, caseSensitive });

      w.onerror = (err) => {
        clearInterval(interval);
        console.error("Worker error:", err);
        reject(err);
      };

      w.onmessage = (ev) => {
        const m = ev.data;

        if (m.f) {
          clearInterval(interval);
          const time = ((performance.now() - start) / 1000).toFixed(2);
          workers.forEach(x => x.terminate());
          resolve({
            address: m.a,
            privateKey: m.p,
            attempts: total + m.n,
            time
          });
        } else if (m.n) {
          total += m.n;
        }
      };
    }
  });
}


function benchmark(durationMs = 1000) {
  const end = Date.now() + durationMs;
  let iterations = 0;

  while (Date.now() < end) {
    const kp = Keypair.generate();
    const addr = kp.publicKey.toBase58();
    // Simulate average comparison overhead
    addr.toLowerCase().startsWith("a");
    iterations++;
  }

  return iterations / (durationMs / 1000);
}

const SPEED_PER_THREAD = benchmark();


export function estimate(prefix = "", suffix = "", threads = 1, caseSensitive = false) {
  const combined = prefix + suffix;
  let probability = 1;

  for (const char of combined) {
    if (caseSensitive) {
      probability *= (1 / 58);
    } else {
      // If case-insensitive, letters usually have 2/58 chance (except some)
      // Base58 pairs: 23 pairs
      // Singletons: L, i, o, and 9 digits
      if (/[a-hj-km-np-z]/i.test(char)) {
        probability *= (2 / 58);
      } else {
        probability *= (1 / 58);
      }
    }
  }

  const difficulty = 1 / probability;
  const attemptsPerSecond = SPEED_PER_THREAD * threads;
  const expectedTimeSeconds = difficulty / attemptsPerSecond;

  return {
    difficulty: Math.floor(difficulty),
    attemptsPerSecond: Math.floor(attemptsPerSecond),
    expectedTimeSeconds: 
    expectedTimeSeconds === Infinity ? 0 : expectedTimeSeconds.toFixed(2)
  };
}