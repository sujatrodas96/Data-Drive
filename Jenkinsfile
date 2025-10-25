pipeline {
    agent any

    environment {
        IMAGE_NAME = "data-drive-container"
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
                sh '''
                    docker build -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Login to Docker Hub & Push Image') {
            steps {
                echo "🔑 Logging into Docker Hub and pushing image..."
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker tag ${IMAGE_NAME}:latest "$DOCKER_USER/${IMAGE_NAME}:latest"
                        docker push "$DOCKER_USER/${IMAGE_NAME}:latest"
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying to EC2..."
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            chmod 600 "$SSH_KEY"
                            ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USER"@"${EC2_HOST}" << 'ENDSSH'
                                echo "🔑 Logging in to Docker Hub..."
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                                
                                echo "📥 Pulling latest image..."
                                docker pull "$DOCKER_USER/${IMAGE_NAME}:latest"
                                
                                echo "🧹 Cleaning up old container..."
                                docker stop data-drive 2>/dev/null || true
                                docker rm data-drive 2>/dev/null || true
                                
                                echo "🚀 Starting new container..."
                                docker run -d -p 3000:3000 --name data-drive --restart unless-stopped "$DOCKER_USER/${IMAGE_NAME}:latest"
                                
                                echo "🔍 Checking container status..."
                                docker ps | grep data-drive || echo "⚠️ Container not found!"
                                
                                docker logout
                            ENDSSH
                        '''
                    }
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
            sh '''
                docker logout 2>/dev/null || true
            '''
        }
    }
}
