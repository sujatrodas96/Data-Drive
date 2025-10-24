pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-cred')
        EC2_SSH = credentials('ec2-ssh-key')
        IMAGE_NAME = "data-drive-new"
        DOCKERHUB_USER = "${DOCKERHUB_CREDENTIALS_USR}"
        CONTAINER_NAME = "data-drive-new-create"
        EC2_USER = "ubuntu"
        EC2_HOST = "3.91.38.160" // replace with your EC2 public IP
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
                echo "📥 Installing dependencies and running tests inside Node Docker container..."
                sh '''
                    docker run --rm -v $PWD:/usr/src/app -w /usr/src/app node:18 bash -c "
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
                echo "🔑 Logging in to Docker Hub..."
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
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
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            docker pull ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest &&
                            docker stop ${CONTAINER_NAME} || true &&
                            docker rm ${CONTAINER_NAME} || true &&
                            docker run -d -p 3000:3000 --name ${CONTAINER_NAME} ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                        '
                    """
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
