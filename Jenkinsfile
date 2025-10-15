pipeline {
    agent any

    environment {
        IMAGE_NAME = "varad1021/web-app-project"
        IMAGE_TAG = "latest"
        DOCKER_HUB_CRED = "docker-hub-cred" // Jenkins credentials ID
        CONTAINER_NAME = "web-app-container-project"
        APP_PORT = "8085"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                // Checkout source code from GitHub
                git branch: 'main', url: 'https://github.com/Varad-ctrl/Project.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat '''
                    echo Building Docker image...
                    docker --version
                    docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
                '''
            }
        }

        stage('Login & Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CRED, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat '''
                        echo Logging in to Docker Hub...
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                        docker push %IMAGE_NAME%:%IMAGE_TAG%
                    '''
                }
            }
        }

        stage('Deploy Container') {
            steps {
                bat '''
                    echo Stopping any existing container...
                    docker rm -f %CONTAINER_NAME% || echo No existing container found.

                    echo Running new container...
                    docker run -d -p %APP_PORT%:80 --name %CONTAINER_NAME% %IMAGE_NAME%:%IMAGE_TAG%

                    echo Checking container status...
                    docker ps -a
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Deployment Successful! Container should be running on port ${APP_PORT}."
        }
        failure {
            echo "❌ Deployment Failed! Check console output for errors."
        }
    }
}
