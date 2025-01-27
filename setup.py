import os
import subprocess
import sys
import venv

def main():
    # Get the project root directory
    project_dir = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(project_dir, 'venv')

    print('Creating virtual environment...')
    # Create virtual environment
    venv.create(venv_dir, with_pip=True)

    # Determine the pip path based on the operating system
    if sys.platform == 'win32':
        pip_path = os.path.join(venv_dir, 'Scripts', 'pip')
    else:
        pip_path = os.path.join(venv_dir, 'bin', 'pip')

    print('Installing dependencies...')
    # Install requirements
    subprocess.check_call([pip_path, 'install', '-r', os.path.join(project_dir, 'requirements.txt')])

    print('\nSetup completed successfully!')
    print('To activate the virtual environment:')
    if sys.platform == 'win32':
        print(f'    Run: {os.path.join(venv_dir, "Scripts", "activate")}')
    else:
        print('    Run: source venv/bin/activate')

if __name__ == '__main__':
    main()