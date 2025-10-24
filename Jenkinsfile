pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-cred')
        EC2_SSH = credentials('ec2-ssh-key')
        IMAGE_NAME = "data-drive-container"
        DOCKERHUB_USER = "${DOCKERHUB_CREDENTIALS_USR}"
        EC2_HOST = "3.91.38.160"
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
                script {
                    sh """
                        # Create SSH key file
                        mkdir -p ~/.ssh
                        echo '${EC2_SSH}' > ~/.ssh/data-drive.pem
                        chmod 600 ~/.ssh/data-drive.pem
                        
                        # Deploy to EC2
                        ssh -o StrictHostKeyChecking=no -i ~/.ssh/data-drive.pem ubuntu@${EC2_HOST} << 'ENDSSH'
                            # Login to Docker Hub
                            echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                            
                            # Pull latest image
                            docker pull ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                            
                            # Stop and remove old container if exists
                            docker stop data-drive 2>/dev/null || true
                            docker rm data-drive 2>/dev/null || true
                            
                            # Run new container
                            docker run -d -p 3000:3000 --name data-drive --restart unless-stopped ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                            
                            # Verify container is running
                            echo "Container status:"
                            docker ps | grep data-drive
                            
                            # Logout from Docker Hub
                            docker logout
ENDSSH
                        
                        # Clean up SSH key
                        rm -f ~/.ssh/data-drive.pem
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
            echo "🌐 Application should be running at http://${EC2_HOST}:3000"
        }
        failure {
            echo "❌ Deployment failed!"
        }
        always {
            echo "🧹 Cleaning up Docker resources..."
            sh """
                docker logout 2>/dev/null || true
                rm -f ~/.ssh/data-drive.pem 2>/dev/null || true
            """
        }
    }
}
