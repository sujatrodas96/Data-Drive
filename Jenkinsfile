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

        stage('Debug SSH Key') {
            steps {
                echo "🔍 Debugging SSH Key format..."
                withCredentials([string(credentialsId: 'ec2-ssh-key-new', variable: 'SSH_KEY_CONTENT')]) {
                    sh '''
                        echo "Creating temporary key file..."
                        echo "$SSH_KEY_CONTENT" > /tmp/debug-key.pem
                        
                        echo "=== Key Statistics ==="
                        echo "File size: $(wc -c < /tmp/debug-key.pem) bytes"
                        echo "Line count: $(wc -l < /tmp/debug-key.pem)"
                        
                        echo "=== First 2 lines ==="
                        head -2 /tmp/debug-key.pem
                        
                        echo "=== Last 2 lines ==="
                        tail -2 /tmp/debug-key.pem
                        
                        echo "=== Checking for Windows line endings ==="
                        if file /tmp/debug-key.pem | grep -q CRLF; then
                            echo "⚠️  WARNING: File has Windows (CRLF) line endings!"
                        else
                            echo "✅ File has Unix (LF) line endings"
                        fi
                        
                        chmod 600 /tmp/debug-key.pem
                        
                        echo "=== Testing SSH with verbose output ==="
                        ssh -vvv -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i /tmp/debug-key.pem ubuntu@3.91.38.160 'echo "Connection test"' 2>&1 || true
                        
                        rm -f /tmp/debug-key.pem
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying to EC2..."
                withCredentials([string(credentialsId: 'ec2-ssh-key-new', variable: 'SSH_KEY_CONTENT')]) {
                    sh '''
                        set -e
                        
                        # Create .ssh directory
                        mkdir -p ~/.ssh
                        
                        # Write SSH key - handle potential line ending issues
                        printf "%s" "$SSH_KEY_CONTENT" > ~/.ssh/data-drive.pem
                        
                        # Ensure Unix line endings
                        dos2unix ~/.ssh/data-drive.pem 2>/dev/null || sed -i 's/\\r$//' ~/.ssh/data-drive.pem 2>/dev/null || true
                        
                        # Fix permissions
                        chmod 600 ~/.ssh/data-drive.pem
                        
                        echo "Testing SSH connection..."
                        if ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i ~/.ssh/data-drive.pem ubuntu@3.91.38.160 'echo "✅ SSH connection successful!"'; then
                            echo "❌ SSH connection failed!"
                            echo "Checking if EC2 is reachable..."
                            ping -c 3 3.91.38.160 || echo "EC2 host not reachable"
                            rm -f ~/.ssh/data-drive.pem
                            exit 1
                        fi
                        
                        echo "Deploying application..."
                        ssh -o StrictHostKeyChecking=no -i ~/.ssh/data-drive.pem ubuntu@3.91.38.160 bash << 'ENDSSH'
set -e

echo "🔐 Logging into Docker Hub..."
echo "''' + env.DOCKERHUB_CREDENTIALS_PSW + '''" | docker login -u "''' + env.DOCKERHUB_CREDENTIALS_USR + '''" --password-stdin

echo "📥 Pulling latest Docker image..."
docker pull ''' + env.DOCKERHUB_CREDENTIALS_USR + '''/''' + env.IMAGE_NAME + ''':latest

echo "🛑 Stopping old container..."
docker stop data-drive 2>/dev/null || true
docker rm data-drive 2>/dev/null || true

echo "🚀 Starting new container..."
docker run -d \
  -p 3000:3000 \
  --name data-drive \
  --restart unless-stopped \
  ''' + env.DOCKERHUB_CREDENTIALS_USR + '''/''' + env.IMAGE_NAME + ''':latest

echo "⏳ Waiting for container to start..."
sleep 3

echo "📊 Container status:"
docker ps --filter name=data-drive

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "🔓 Logging out from Docker Hub..."
docker logout

echo "✅ Deployment completed successfully!"
ENDSSH
                        
                        # Clean up SSH key
                        rm -f ~/.ssh/data-drive.pem
                        
                        echo "🎉 Application deployed successfully!"
                    '''
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
            echo "💡 Check the debug output above for details."
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
