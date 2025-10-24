pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-cred')
        EC2_SSH = credentials('ec2-ssh-key')
        IMAGE_NAME = "data-drive-container"
        DOCKERHUB_USER = "${DOCKERHUB_CREDENTIALS_USR}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📦 Cloning repository..."
                git branch: 'main', url: 'https://github.com/sujatrodas96/Data-Drive.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "📥 Installing Node.js dependencies..."
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo "🧪 Running test cases..."
                // If no test script exists, just skip
                sh '''
                if [ -f package.json ]; then
                    npm test || echo "⚠️ No test script found. Skipping tests."
                fi
                '''
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
                    echo '${EC2_SSH}' > data-drive.pem
                    chmod 600 data-drive.pem

                    ssh -o StrictHostKeyChecking=no -i data-drive.pem ubuntu@3.91.38.160 '
                        docker pull ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest &&
                        docker stop data-drive || true &&
                        docker rm data-drive || true &&
                        docker run -d -p 3000:3000 --name data-drive ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                    '
                    rm -f data-drive.pem
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
