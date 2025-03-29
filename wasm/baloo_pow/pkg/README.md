# Compile for wasm

## Install dependencies

```
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

## Build

```
cargo build --release --target wasm32-unknown-unknown
wasm-pack build -t web --release
```

By default pkg will also be added to gitignore, we don't want that, since we serve it over jsdelivr