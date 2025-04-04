<div align="center">
	<img src="src/assets/icons/icon_128x128.png">
  <h1>Monerod GUI</h1>
  
![Maintained][maintained-badge]
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/c705f535eebe4ba8b7a5789f6b409933)](https://app.codacy.com/gh/everoddandeven/monerod-gui/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Make a pull request][prs-badge]][prs]
[![License][license-badge]](LICENSE.md)
[![Lint Test](https://github.com/everoddandeven/monerod-gui/actions/workflows/lint.yml/badge.svg)](https://github.com/everoddandeven/monerod-gui/actions/workflows/lint.yml)

[![Linux](https://github.com/everoddandeven/monerod-gui/actions/workflows/linux.yml/badge.svg)](https://github.com/everoddandeven/monerod-gui/actions/workflows/linux.yml)
[![MacOS Build](https://github.com/everoddandeven/monerod-gui/actions/workflows/macos.yml/badge.svg)](https://github.com/everoddandeven/monerod-gui/actions/workflows/macos.yml)
[![Windows Build](https://github.com/everoddandeven/monerod-gui/actions/workflows/windows.yml/badge.svg)](https://github.com/everoddandeven/monerod-gui/actions/workflows/windows.yml)

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]

[![XMR Donated](https://img.shields.io/badge/donated-8.757300489601_XMR-blue?logo=monero)](https://github.com/everoddandeven/monerod-gui?tab=readme-ov-file#monero)
[![BTC Donated][bitcoin-donated-badge]][bitcoin-donated]

</div>

## Introduction

**Monerod GUI** is a desktop application that provides a graphical user interface (GUI) for installing, updating, and interacting with the Monero daemon (`monerod`). This tool simplifies the process of managing a full Monero node, enabling users to run, configure, and monitor `monerod` without needing to use the command line.

## Demo

https://github.com/user-attachments/assets/c4a50d2f-5bbb-48ac-9425-30ecc20ada7c

## Features

### 1. Simple Monerod Setup

- Automatically downloads and installs the latest version of `monerod` based on your operating system (Windows, macOS, Linux).
- Provides configuration options for running `monerod` with custom parameters (e.g., enabling testnet, fast block sync, blockchain pruning).

### 2. Seamless Updates

- Automatically checks for new `monerod` releases.
- One-click updates to the latest version, keeping your node secure and up-to-date.

### 3. Interactive Control Panel

- Start, stop, and monitor the status of the Monero daemon from an intuitive control panel.
- Configure important `monerod` settings like RPC access, logging level, concurrency, and more from the GUI.

### 4. Real-Time Log Monitoring

- Displays real-time `monerod` logs in a clean, readable format, helping users track sync progress, transactions, and errors.
- Offers log filtering for easier monitoring of specific events or errors.

### 5. Network and Connectivity Monitoring

- Detects whether your current connection is over Wi-Fi and provides feedback on network stability.
- Supports external bind confirmations and allows for easy configuration of RPC access control for enhanced security.

### 6. Cross-Platform Support

- Monerod GUI automatically detects the operating system and selects the appropriate `monerod` version to download.
- Available for Windows, macOS, and Linux.

### 7. Customizable Installation

- Users can choose the installation directory for `monerod`, allowing for greater flexibility in managing the software on different systems.

### 8. Anonymous Network Support

- It is possible to start a `TOR` and/or `I2P` service through the node settings. This allows the user to synchronize, relay txs, and make their node available under an anonymous network in a simple and immediate way, just a few clicks.

### Usage

1. On the first run, Monerod GUI will detect your operating system and prompt you to download the appropriate version of `monerod`.
2. Once installed, you can start the Monero daemon with one click and configure various settings like testnet mode, fast sync, and more.
3. Monitor real-time logs to keep track of blockchain synchronization and transaction details.

## To Do

- [X] Upgrade Electron to latest version
- [X] Upgrade Angular to latest version
- [ ] Implement e2e tests
- [X] Detect wired/Wi-Fi connection
- [X] Detect battery/ac power
- [ ] Detect preinstalled `monerod`
  - [X] Linux
  - [ ] Windows
  - [ ] MacOs
- [ ] Detect already running `monerod` instance
- [X] Automatic startup at login
  - [X] Linux
  - [X] Windows
  - [X] MacOS
- [X] Installers
  - [X] Linux
  - [X] Windows
  - [X] MacOS 
- [ ] Packages
  - [X] Linux DEB
  - [X] Linux RPM
  - [X] Linux AppImage
  - [ ] Linux Flatpack
  - [ ] Linux Snap
  - [X] Windows Portable EXE 
  - [X] Windows Installer MSI
  - [X] MacOS DMG
  - [X] MacOS PKG
  - [X] MacOS DMG Installer
- [X] Import/export `monerod.conf` node configuration
- [X] Synchronization in a specific time slot
- [ ] Prompt user access control for administration operation
- [ ] Check for new versions of the GUI
- [ ] Wallet RPC management
- [ ] Blockchain tools
  - [X] Private testnet
  - [ ] Import blockchain
  - [ ] Export blockchain
  - [ ] Prune blockchain
  - [ ] Blockchain explorer
  - [ ] Blockchain ancestry
  - [ ] Blockchain stats
  - [ ] Blockchain usage
  - [ ] Blockchain depth
- [ ] Mining tools
  - [ ] Calculator
  - [ ] XMRig integration
  - [ ] P2Pool integration
- [ ] Network tools
  - [ ] Generate SSL certificate
  - [X] Tor integration
  - [X] I2P integration
- [ ] Remote node management
  - [ ] No CORS connection
  - [ ] SSH connection
- [ ] Move to Tauri
- [X] Port and upgrade `battery-level` dependency
- [ ] Make this project also deployable in a web server
- [ ] Option to download/use `cuprated` instead of `monerod`
- [ ] Restricted RPC GUI mode
- [ ] Light Wallet Server integration
- [ ] Detect Whonix and use system proxy

## Getting Started

*Clone this repository locally:*

``` bash
git clone https://github.com/everoddandeven/monerod-gui.git
```

*Install dependencies with npm (used by Electron renderer process):*

``` bash
npm install
```

There is an issue with `yarn` and `node_modules` when the application is built by the packager. Please use `npm` as dependencies manager.

*Install NodeJS dependencies with npm (used by Electron main process):*

``` bash
cd app/
npm install
```

Why two package.json ? This project follow [Electron Builder two package.json structure](https://www.electron.build/tutorials/two-package-structure) in order to optimize final bundle and be still able to use Angular `ng add` feature.

## Project structure

| Folder | Description                                      |
|--------|--------------------------------------------------|
| app    | Electron main process folder (NodeJS)            |
| src    | Electron renderer process folder (Web / Angular) |

## To build for development

| Command                      | Description                                                                                           |
|------------------------------|-------------------------------------------------------------------------------------------------------|
| `npm run electron:local:dev` | Builds your application and start electron locally (DEV MODE)                                         |


If you want to generate Angular components with Angular-cli , you **MUST** install `@angular/cli` in npm global context.
Please follow [Angular-cli documentation](https://github.com/angular/angular-cli) if you had installed a previous version of `angular-cli`.

``` bash
npm install -g @angular/cli
```

## To build for production

| Command                      | Description                                                                                           |
|------------------------------|-------------------------------------------------------------------------------------------------------|
| `npm run electron:local`     | Builds your application and start electron locally                                                    |
| `npm run electron:build`     | Builds your application and creates an app and installer for Windows                                  |
| `npm run electron:build:deb` | Builds your application and creates an installer consumable for debian based operating systems        |
| `npm run electron:build:rpm` | Builds your application and creates an installer consumable for redhat based operating systems        |
| `npm run electron:build:mac` | Builds your application and creates an installer consumable for MacOS                                 |


**Your application is optimised. Only /dist folder and NodeJS dependencies are included in the final bundle.**

## E2E Testing

E2E Test scripts can be found in `e2e` folder.

| Command       | Description               |
|---------------|---------------------------|
| `npm run e2e` | Execute end to end tests  |

Note: To make it work behind a proxy, you can add this proxy exception in your terminal  
`export {no_proxy,NO_PROXY}="127.0.0.1,localhost"`

## Debug with VsCode

[VsCode](https://code.visualstudio.com/) debug configuration is available! In order to use it, you need the extension [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome).

Then set some breakpoints in your application's source code.

Finally from VsCode press **Ctrl+Shift+D** and select **Application Debug** and press **F5**.

Please note that Hot reload is only available in Renderer process.

## Donating

Please consider donating to support the development of this project.

### Monero

<p align="center">
 <img src="donate.png" width="115" height="115" alt="xmrQrCode"/><br>
 <code>84Q1SdQgFWaEWRn5KcvSPCQUa3NF39EJ3HPCTaiM86RHLLftqgTZpkP24jXrK5YpeedWbQAjHcFcDLpFJfr9TypfAU7pPjA</code>
</p>

### Bitcoin

<p align="center">
 <img src="donate_btc.png" width="115" height="115" alt="btcQrCode"/><br>
 <code>bc1qndc2lesy0sse9vj33a35pnfrqz4znlhhs58vfp</code>
</p>

### Wownero

<p align="center">
 <img src="donate_wow.png" width="115" height="115" alt="wowQrCode"/><br>
 <code>WW33Zj3xu6EGTyKVWaz8EQZmqsTXKdK5eG7PDRaiPuJ1LyREhGHLCRDX3AaLx4r9NFCThRvsbq99KATbswJaxd3T1iwQLJ3Tw</code>
</p>

[maintained-badge]: https://img.shields.io/badge/maintained-yes-brightgreen
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[prs-badge]: https://img.shields.io/badge/PRs-welcome-red.svg
[prs]: http://makeapullrequest.com

[macos-build-badge]: https://github.com/everoddandeven/monerod-gui/workflows/MacOS%20Build/badge.svg
[macos-build]: https://github.com/everoddandeven/monerod-gui/actions?query=workflow%3A%22MacOS+Build%22
[windows-build-badge]: https://github.com/everoddandeven/monerod-gui/workflows/Windows%20Build/badge.svg
[windows-build]: https://github.com/everoddandeven/monerod-gui/actions?query=workflow%3A%22Windows+Build%22

[github-watch-badge]: https://img.shields.io/github/watchers/everoddandeven/monerod-gui.svg?style=social
[github-watch]: https://github.com/everoddandeven/monerod-gui/watchers
[github-star-badge]: https://img.shields.io/github/stars/everoddandeven/monerod-gui.svg?style=social
[github-star]: https://github.com/everoddandeven/monerod-gui/stargazers

[bitcoin-donated]: https://github.com/everoddandeven/monerod-gui?tab=readme-ov-file#bitcoin
[bitcoin-donated-badge]: https://img.shields.io/badge/dynamic/json?url=https://explorer.viawallet.com/res/btc/addresses/bc1qndc2lesy0sse9vj33a35pnfrqz4znlhhs58vfp&query=$.data.balance&suffix=%20BTC&logo=bitcoin&label=donated
