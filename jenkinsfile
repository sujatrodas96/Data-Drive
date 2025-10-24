pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-cred')
        EC2_SSH = credentials('ec2-ssh-key')
        IMAGE_NAME = "data-drive"
        DOCKERHUB_USER = "${DOCKERHUB_CREDENTIALS_USR}"
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
                sh """
                    docker build -t ${IMAGE_NAME}:latest .
                """
            }
        }

        stage('Login to Docker Hub') {
            steps {
                echo "🔑 Logging in to Docker Hub..."
                sh """
                    echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                """
            }
        }

        stage('Tag & Push Docker Image') {
            steps {
                echo "📤 Pushing Docker image to Docker Hub..."
                sh """
                    docker tag ${IMAGE_NAME}:latest ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                    docker push ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying to EC2..."
                sh """
                    echo '${EC2_SSH}' > ec2_key.pem
                    chmod 600 ec2_key.pem

                    ssh -o StrictHostKeyChecking=no -i ec2_key.pem ubuntu@<YOUR_EC2_PUBLIC_IP> '
                        docker pull ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest &&
                        docker stop data-drive || true &&
                        docker rm data-drive || true &&
                        docker run -d -p 3000:3000 --name data-drive ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                    '
                    rm -f ec2_key.pem
                """
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
