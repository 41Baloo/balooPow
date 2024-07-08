# balooPow

balooPow is a JavaScript library designed for client-side proof-of-work (PoW) computation.

a demonstration can be found at https://41baloo.github.io/balooPow/

## What is Proof of Work (PoW)?

Proof of Work (PoW) is a mechanism used to ensure that a certain amount of computational effort has been expended before a request is processed. This mechanism is widely used in various contexts, such as cryptocurrency mining, spam prevention, and DDoS mitigation.

## Why is PoW Useful?

PoW is very easy to validate on the server-side but requires significant computational effort from the client. This means that PoW can be used to slow down potential spammers, bot traffic, or otherwise unwanted traffic by ensuring that clients have to invest computational effort before their requests are processed. This helps to:

- **Mitigate Spam**: Reduce spam by making it computationally expensive to send large numbers of requests.
- **Prevent DDoS Attacks**: Slow down attackers by requiring substantial computational resources to overwhelm the server.
- **Ensure Fair Resource Usage**: Prevent abuse of resources by ensuring that only clients who have solved the PoW challenge can access them.

## How Does It Work?

1. **Generate Public and Secret Salts**:
   - When a client visits your website for the first time, you generate a `publicSalt` which is a random string of letters and numbers, and a `secretSalt`, which is a number between `0` and `difficulty`.
   
2. **Create the Challenge**:
   - Your server combines the `publicSalt` and `secretSalt` and hashes them using `SHA-256`. The result of that is the `challenge`.
   - Your server combines the `secretSalt` and `publicSalt` and hashes them using `SHA-256`. The result of that is the `solution`.
   
3. **Send the Challenge to the Client**:
   - You provide the client with the `publicSalt`, `difficulty`, and `challenge`.

4. **Client Solves the Challenge**:
   - The client knows the `challenge` is the result of `publicSalt` + `secretSalt`. It starts bruteforcing all possible values in the range from `0` to `difficulty`, hashing each one combined with the `publicSalt` until it finds a hash that matches the `challenge`.

5. **Client Proves Work**:
   - The client sends the bruteforced `solution` (`SHA-256` hash of `secretSalt` + `publicSalt`) back to the server.
   - The server validates the `solution` provided by the client matches the previously calculated `solution`.

With these steps, you can be certain that the client has invested significant computational effort to solve the challenge.

## Client-Side Usage

Simply include the library on your challenge page like this
```html
<!-- Minified Version -->
<script src="https://cdn.jsdelivr.net/gh/41Baloo/balooPow@main/balooPow.min.js"></script>

<!-- Normal Version -->
<!-- <script src="https://cdn.jsdelivr.net/gh/41Baloo/balooPow@main/balooPow.min.js"></script> -->
```

```js
const pow = new BalooPow(publicSalt, difficulty, challenge);
const solution = await pow.Solve();
```

## WASM

You can find an implementation of balooPow using wasm under https://41Baloo.github.io/balooPow/wasm.html

If so desired, you can include it via

```html
<script src="https://cdn.jsdelivr.net/gh/41Baloo/balooPow@main/balooPow.wasm.min.js"></script>
```

This version is significantly faster when bruteforcing high difficulties, however for difficulties < 1.000.000, the additional cost of fetching the wasm for every spawned worker is usually not worth it