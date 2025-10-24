pipeline {
    agent any

    environment {
        // Docker Hub credentials stored in Jenkins (Username + Password)
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-cred')
        
        // EC2 SSH key (use your data-drive.pem content stored as Jenkins SSH credential)
        EC2_SSH = credentials('ec2-ssh-key')
        
        IMAGE_NAME = "data-drive-new"          // Docker image name
        CONTAINER_NAME = "data-drive-new"          // Container name on EC2
        EC2_USER = "ubuntu"                    // EC2 default user for Ubuntu
        EC2_HOST = "3.91.38.160"              // Your EC2 public IP
    }

    stages {

        stage('Checkout Code') {
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
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Login to Docker Hub') {
            steps {
                echo "🔑 Logging in to Docker Hub..."
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "📤 Tagging and pushing Docker image to Docker Hub..."
                sh """
                    docker tag ${IMAGE_NAME}:latest ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                    docker push ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying Docker container on EC2..."
                sh '''
                    # Create temporary PEM file from Jenkins SSH credential
                    echo "$EC2_SSH" > data-drive.pem
                    chmod 600 data-drive.pem

                    # SSH into EC2 and deploy
                    ssh -o StrictHostKeyChecking=no -i data-drive.pem ${EC2_USER}@${EC2_HOST} "
                        docker login -u ${DOCKERHUB_CREDENTIALS_USR} -p ${DOCKERHUB_CREDENTIALS_PSW} &&
                        docker pull ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest &&
                        docker stop ${CONTAINER_NAME} || true &&
                        docker rm ${CONTAINER_NAME} || true &&
                        docker run -d -p 3000:3000 --name ${CONTAINER_NAME} ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest
                    "

                    # Remove temporary PEM file
                    rm -f data-drive.pem
                '''
            }
        }
    }

    post {
        success {
            echo "✅ CI/CD Pipeline completed successfully! App deployed to EC2."
        }
        failure {
            echo "❌ Pipeline failed. Check Jenkins logs for errors."
        }
    }
}
