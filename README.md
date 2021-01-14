# react-native-edison-editor

## Secondary development of this package

---

### if you want change the `index.html`(webview content):

#### 1. install the dependencies

`yarn`

#### 2. run react app

- `yarn dev` to start react app in localhost

#### 3. change webview uri

change the code in file `{your project}/node_modules/react-native-edison-editor/index.js`

```
var htmlPath = "file://" + RNFS.MainBundlePath + "/assets/node_modules/" + Package.name + "/index.html";
```

to:

```
var htmlPath = "http://localhost:8080/"
```

#### 4. finish change and build

`yarn build`

#### 5. publish

`npm publish`

---

### if you want change the `index.js` or `index.d.ts`(webview shell):

#### 1. copy the `index.tsx` to node_modules in you project

```shell
cp ./index.tsx {your project}/node_modules/react-native-edison-editor/
```

#### 2. change the main in package.json

change the `main` in `node_modules/react-native-edison-editor/package.json` to `"index.tsx"` and delete `"types": "index.d.ts"`

#### 3. finish change and build

copy `index.tsx` change code to react-native-edison-editor,

`yarn build`

#### 4. publish

`npm publish`
