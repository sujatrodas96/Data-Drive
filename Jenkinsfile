pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-cred')
        IMAGE_NAME = "data-drive-container"
        DOCKERHUB_USER = "${DOCKERHUB_CREDENTIALS_USR}"
        EC2_HOST = "3.91.38.160"
        EC2_USER = "ubuntu"
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
                withCredentials([file(credentialsId: 'ec2-ssh-key-new', variable: 'SSH_KEY_FILE')]) {
                    sh """
                        # Create .ssh directory if it doesn't exist
                        mkdir -p ~/.ssh
                        
                        # Copy the SSH key file
                        cp \${SSH_KEY_FILE} ~/.ssh/data-drive.pem
                        chmod 600 ~/.ssh/data-drive.pem
                        
                        # Test SSH connection
                        echo "Testing SSH connection..."
                        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i ~/.ssh/data-drive.pem ${EC2_USER}@${EC2_HOST} 'echo "SSH connection successful!"'
                        
                        # Deploy application
                        ssh -o StrictHostKeyChecking=no -i ~/.ssh/data-drive.pem ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
set -e

echo "Logging into Docker Hub..."
echo "${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "${DOCKERHUB_CREDENTIALS_USR}" --password-stdin

echo "Pulling latest Docker image..."
docker pull ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest

echo "Stopping old container..."
docker stop data-drive 2>/dev/null || true
docker rm data-drive 2>/dev/null || true

echo "Starting new container..."
docker run -d \\
  -p 3000:3000 \\
  --name data-drive \\
  --restart unless-stopped \\
  ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest

echo "Waiting for container to start..."
sleep 3

echo "Container status:"
docker ps --filter name=data-drive

echo "Cleaning up old images..."
docker image prune -f

echo "Logging out from Docker Hub..."
docker logout

echo "✅ Deployment completed successfully!"
ENDSSH
                        
                        # Clean up SSH key
                        rm -f ~/.ssh/data-drive.pem
                        
                        echo "🎉 Application deployed successfully!"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
            echo "🌐 Application is running at http://${EC2_HOST}:3000"
        }
        failure {
            echo "❌ Deployment failed!"
            echo "Check the logs above for details."
        }
        always {
            echo "🧹 Cleaning up..."
            sh """
                docker logout 2>/dev/null || true
                rm -f ~/.ssh/data-drive.pem 2>/dev/null || true
            """
        }
    }
}
