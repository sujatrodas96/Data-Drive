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

        stage('DockerHub Login & Push') {
            steps {
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
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    string(credentialsId: 'SUPABASE_URL', variable: 'SUPABASE_URL'),
                    string(credentialsId: 'SUPABASE_ANON_KEY', variable: 'SUPABASE_ANON_KEY'),
                    string(credentialsId: 'SUPABASE_BUCKET', variable: 'SUPABASE_BUCKET'),
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL')
                ]) {
                    sh '''
                        chmod 600 "$SSH_KEY"

                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USER"@"${EC2_HOST}" "
                            # DockerHub login
                            echo '$DOCKER_PASS' | docker login -u '$DOCKER_USER' --password-stdin
                            
                            # Stop & remove old container if exists
                            docker stop data-drive 2>/dev/null || true
                            docker rm data-drive 2>/dev/null || true
                            
                            # Pull latest image
                            docker pull '$DOCKER_USER/${IMAGE_NAME}:latest'
                            
                            # Run new container with all environment variables
                            docker run -d -p 3000:3000 --name data-drive --restart unless-stopped \
                                -e SUPABASE_URL='$SUPABASE_URL' \
                                -e SUPABASE_ANON_KEY='$SUPABASE_ANON_KEY' \
                                -e SUPABASE_BUCKET='$SUPABASE_BUCKET' \
                                -e MONGO_URL='$MONGO_URL' \
                                -e PORT=3000 \
                                '$DOCKER_USER/${IMAGE_NAME}:latest'
                            
                            # Verify container is running
                            docker ps | grep data-drive || echo '⚠️ Container not running'
                            
                            docker logout
                        "
                    '''
                }
            }
        }

    }

    post {
        success {
            echo "✅ Deployment successful! App should be running at http://${EC2_HOST}:3000"
        }
        failure {
            echo "❌ Deployment failed!"
        }
        always {
            echo "🧹 Cleaning up..."
            sh '''
                docker logout 2>/dev/null || true
            '''
        }
    }
}
