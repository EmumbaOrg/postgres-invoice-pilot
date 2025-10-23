# 2.1 Development Environment Setup

This workshop uses a `Dev Container` for the development environment setup. Dev Containers are useful tools that help minimize setup and configuration issues that may occur (sometimes known as the "it works on my machine" problem).

There are many prerequisite installation requirements for this solution accelerator. By using the Dev Container, these prerequisites are installed automatically inside the container without variability or risk of configuration drift.

For more background on dev containers, read the [documentation](https://code.visualstudio.com/docs/devcontainers/containers).

## Setup Using Dev Container

Using a `Dev Container` will minimize the amount of software you need to install on your local operating system.  The following is the minimum needed to build and run the `dev container`:

![Dev Containers.](https://code.visualstudio.com/assets/docs/devcontainers/containers/architecture-containers.png)

### Install Software

The required development environment uses a Visual Studio (VS) Code editor with a Python runtime. To complete this lab on your own computer, you must install the following required software. On completing this step, you should have installed:

- [X] Windows Terminal (Only if using Windows)
- [X] WSL 2 and Ubuntu (Only if using Windows)
- [X] Git
- [X] Docker desktop
- [X] Visual Studio Code
- [X] pgAdmin

### Install Windows Terminal (Only if using Windows)

Much nicer than the old cmd.exe or bare PowerShell.

1. From Microsoft Store: [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701)

### Install WSL 2 and Ubuntu (Only if using Windows)

Windows Subsystem for Linux (WSL) is a powerful tool that allows the ability to run Linux based Docker images on the Windows operating system.  Plus, WSL 2 provides advantages to using Docker Desktop on Windows, such as better memory management for large containers.  WSL 2 is needed because the dev container for this solution accelerator is built on an Ubuntu Linux base image.

1. First we need to install Ubuntu from the Microsoft App Store:

    - Open "Microsoft Store" from your Start Menu
    - Search for "Ubuntu"
    - For the search result titled simply "Ubuntu", select and click "Get" to install
    - Reboot if it asks.

2. Open PowerShell as Admin and run:

    ```powershell title=""
    wsl --install
    ```

3. It will install WSL 2.
4. Reboot if it asks.
5. Test the installation:

    - Opening Terminal in PowerShell shell, and type `wsl'
    - This should load an Ubuntu Linux Shell command line and if you type `ps` you will be a list of processes, this means everything works correctly

### Install Git

Git enables you to manage your code by tracking changes, maintaining a version history, and facilitating collaboration with others. This helps in organizing and maintaining the integrity of your project's development.

1. Download Git from <https://git-scm.com/downloads>.

2. Run the installer using the default options.

### Install Docker Desktop

Docker Desktop is an application that allows you to build, share, and run containerized applications on your local machine. It provides a user-friendly interface to manage Docker containers, images, and networks. By streamlining the containerization process, Docker Desktop helps you develop, test, and deploy applications consistently across different environments.

1. Download and install Docker Desktop for your OS:

    - [Linux](https://docs.docker.com/desktop/setup/install/linux/)
    - [Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
    - [Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

2. Configure Docker Desktop to use WSL 2 based engine

    - Open Docker Desktop
    - Click Settings
    - Click General
    - Select `Use the WSL 2 based engine`
    - Click `Apply & restart`

3. Configure Docker Desktop to use WSL 2 integration

    - Open Docker Desktop
    - Click Resources
    - Click WSL integration
    - Select `Enable integration with my default WSL distro`
    - Select `Ubuntu`
    - Click `Apply & restart`

### Install Visual Studio Code

Visual Studio Code is a versatile, open-source code editor that combines powerful features with an intuitive interface to help you efficiently write, debug, and customize projects. Note that
the needed extensions will automatically be installed within the `dev container`, so no need to install any additional extensions now.

1. Download and install from <https://code.visualstudio.com/download>.

    - Use the default options in the installer.

2. After installation completed, launch Visual Studio Code.

3. In the **Extensions** menu, search for and install the following extensions from Microsoft:

    - [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

4. Close VS Code.

### Install pgAdmin

Throughout this workshop, you will use pgAdmin to run queries against your PostgreSQL database. pgAdmin is the leading Open Source management tool for Postgres.

1. Download pgAdmin from <https://www.pgadmin.org/download/>.

2. Run the installer using the default options.

---

That's it! You now have all the required software installed to use the Dev Container for this workshop. The Dev Container will handle all the other dependencies automatically when you open the project.
