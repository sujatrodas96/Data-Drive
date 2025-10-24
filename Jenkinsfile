pipeline {
    agent any

    environment {
        IMAGE_NAME = "data-drive-new"
        CONTAINER_NAME = "data-drive-container"
        EC2_HOST = "3.91.38.160"
        DOCKER_HUB_USER = "sujatro123"
        DOCKER_HUB_TOKEN = "dckr_pat_dLVHwuc2RCn5y1BjXAWwsSR0HN8"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📦 Cloning repository..."
                git branch: 'main', url: 'https://github.com/sujatrodas96/Data-Drive.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Login & Push to Docker Hub') {
            steps {
                echo '🔑 Logging in & pushing image to Docker Hub...'
                sh '''
                    echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USER" --password-stdin
                    docker tag ${IMAGE_NAME}:latest ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                    docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying to EC2..."

                sshagent(['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@3.91.38.160 "
                            docker login -u ${DOCKER_HUB_USER} -p ${DOCKER_HUB_TOKEN} &&
                            docker pull ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest &&
                            docker stop ${CONTAINER_NAME} || true &&
                            docker rm ${CONTAINER_NAME} || true &&
                            docker run -d -p 3000:3000 --name ${CONTAINER_NAME} ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}
