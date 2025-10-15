pipeline {
    agent any

    environment {
        IMAGE_NAME = "varad1021/web-app-project"
        IMAGE_TAG = "latest"
        DOCKER_HUB_CRED = "docker-hub-cred" // Jenkins credentials ID
        CONTAINER_NAME = "web-app-container-project"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                git branch: 'main', url: 'https://github.com/Varad-ctrl/Project.git', credentialsId: DOCKER_HUB_CRED
            }
        }

        stage('Build Docker Image') {
            steps {
                bat """
                    docker --version
                    docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
                """
            }
        }

        stage('Login & Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CRED, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat """
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                        docker push %IMAGE_NAME%:%IMAGE_TAG%
                    """
                }
            }
        }

        stage('Deploy Container') {
            steps {
                bat """
                    REM Stop and remove existing container if exists
                    docker rm -f %CONTAINER_NAME% || exit 0

                    REM Run new container
                    docker run -d -p 8085:80 --name %CONTAINER_NAME% %IMAGE_NAME%:%IMAGE_TAG%
                """
            }
        }
    }

    post {
        success {
            echo "✅ Deployment Successful!"
        }
        failure {
            echo "❌ Deployment Failed!"
        }
    }
}



