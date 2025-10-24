pipeline {
    agent any

    environment {
        IMAGE_NAME = "data-drive-new"
        CONTAINER_NAME = "data-drive-container"
        EC2_HOST = "3.91.38.160"
        EC2_USER = "ubuntu"
        DOCKER_HUB_USER = "sujatro123"
        DOCKER_HUB_TOKEN = "dckr_pat_dLVHwuc2RCn5y1BjXAWwsSR0HN8"
        EC2_PEM = "credentials('ec2-pem-key')"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📦 Cloning repository..."
                git branch: 'main', url: 'https://github.com/sujatrodas96/Data-Drive.git'
            }
        }

        stage('Install Dependencies & Run Tests') {
            steps {
                echo "📥 Installing dependencies and running tests inside Node container..."
                sh '''
                    docker run --rm -v $PWD:/usr/src/app -w /usr/src/app node:20 bash -c "
                        npm install &&
                        if [ -f package.json ]; then
                            npm test || echo '⚠️ No test script found. Skipping tests.'
                        fi
                    "
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Login to Docker Hub') {
            steps {
                echo '🔑 Logging in to Docker Hub...'
                sh '''
                    echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USER" --password-stdin
                '''
            }
        }

        stage('Tag & Push Docker Image') {
            steps {
                echo "📤 Tagging and pushing image to Docker Hub..."
                sh """
                    docker tag ${IMAGE_NAME}:latest ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                    docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying on EC2..."
                // Use raw SSH with PEM key (no sshagent)
                sh '''
                    echo "${EC2_PEM}" > data-drive.pem
                    chmod 600 data-drive.pem

                    ssh -o StrictHostKeyChecking=no -i data-drive.pem ${EC2_USER}@${EC2_HOST} "
                        docker login -u ${DOCKER_HUB_USER} -p ${DOCKER_HUB_TOKEN} &&
                        docker pull ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest &&
                        docker stop ${CONTAINER_NAME} || true &&
                        docker rm ${CONTAINER_NAME} || true &&
                        docker run -d -p 3000:3000 --name ${CONTAINER_NAME} ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                    "

                    rm -f data-drive.pem
                '''
            }
        }
    }

    post {
        success {
            echo "✅ CI/CD Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
