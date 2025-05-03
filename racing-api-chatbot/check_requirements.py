#!/usr/bin/env python3
import argparse
import logging
import pkg_resources
import subprocess
import sys
from typing import List, Tuple

def parse_requirements_file(requirements_file: str) -> List[str]:
    """Parse the requirements file and return a list of valid requirement strings."""
    requirements = []
    try:
        with open(requirements_file, 'r') as file:
            # Use pkg_resources to handle version specifiers correctly.
            for req in pkg_resources.parse_requirements(file):
                requirements.append(str(req))
    except FileNotFoundError:
        logging.error("Requirements file '%s' not found.", requirements_file)
        sys.exit(1)
    except Exception as e:
        logging.error("An error occurred while parsing the requirements file: %s", e)
        sys.exit(1)
    return requirements

def check_packages(requirements: List[str]) -> Tuple[List[str], List[str]]:
    """Check which packages are installed and which are missing or conflict."""
    installed = []
    missing = []
    for package in requirements:
        try:
            pkg_resources.require(package)
            logging.info("%s is installed.", package)
            installed.append(package)
        except pkg_resources.DistributionNotFound:
            logging.warning("%s is NOT installed.", package)
            missing.append(package)
        except pkg_resources.VersionConflict as e:
            logging.warning("%s has a version conflict: %s", package, e)
            missing.append(package)
    return installed, missing

def install_packages(packages: List[str]):
    """Install the missing packages using pip."""
    for package in packages:
        try:
            logging.info("Installing %s...", package)
            subprocess.run([sys.executable, "-m", "pip", "install", package],
                           check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            logging.info("%s installed successfully.", package)
        except subprocess.CalledProcessError as e:
            logging.error("Failed to install %s. Error: %s", package, e)

def check_and_install(requirements_file="requirements.txt", auto_install=False):
    """Check requirements and install missing packages if auto_install is True."""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s: %(message)s"
    )
    
    logging.info("Checking required packages from %s...", requirements_file)
    requirements = parse_requirements_file(requirements_file)
    installed, missing = check_packages(requirements)

    # Display summary
    logging.info("\nSummary:")
    logging.info("Installed packages (%d):", len(installed))
    logging.info("Missing packages (%d):", len(missing))
    for pkg in missing:
        logging.info("  - %s", pkg)

    if missing:
        if auto_install:
            logging.info("Auto-installing missing packages...")
            install_packages(missing)
            return True
        else:
            response = input("\nDo you want to install the missing packages? (yes/no): ").strip().lower()
            if response in ['yes', 'y']:
                install_packages(missing)
                return True
            else:
                logging.info("Installation aborted by the user.")
                return False
    return True

def main():
    parser = argparse.ArgumentParser(description="Check and install Python package requirements.")
    parser.add_argument("-r", "--requirements", default="requirements.txt",
                        help="Path to the requirements file (default: requirements.txt)")
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="Increase output verbosity")
    parser.add_argument("-a", "--auto-install", action="store_true",
                        help="Automatically install missing packages without prompting")
    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s"
    )

    requirements = parse_requirements_file(args.requirements)
    installed, missing = check_packages(requirements)

    # Display summary
    logging.info("\nSummary:")
    logging.info("Installed packages (%d):", len(installed))
    for pkg in installed:
        logging.info("  - %s", pkg)
    logging.info("Missing packages (%d):", len(missing))
    for pkg in missing:
        logging.info("  - %s", pkg)

    if missing:
        if args.auto_install:
            install_packages(missing)
        else:
            response = input("\nDo you want to install the missing packages? (yes/no): ").strip().lower()
            if response in ['yes', 'y']:
                install_packages(missing)
            else:
                logging.info("Installation aborted by the user.")

if __name__ == "__main__":
    main()