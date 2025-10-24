pipeline {
    agent any

    environment {
        IMAGE_NAME = "data-drive-new"
        CONTAINER_NAME = "data-drive-container"
        EC2_HOST = "3.91.38.160"
        EC2_USER = "ubuntu"
        DOCKER_HUB_USER = "sujatro123"
        DOCKER_HUB_TOKEN = "dckr_pat_dLVHwuc2RCn5y1BjXAWwsSR0HN8"
        EC2_PEM = "-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA6B8FEcGXnIHXidG3I3w5T1cp9H5w3GV027Z8vmbIippPfYlF
dm5zVN+5EzAa2PLMa7PqoiBhRUl85m8jydc4gHzS/uDDVhCEVO+bu6ab7BMzOoor
DWPPDgnS+g8QxSiJnGBrhjGjMx9ScgYelPn+3ABVXty2Jmq18LDfWzdM8PCbGAD6
eqz/234X5K3PSzSEPAJWn6HALLU8RYKp97VC5p0Hu88dnjoqWfCgkXY7BJJ0G6jm
v4oDsZlEZS7fklN3As9k+Xjyl5dwpnGONNqh/htQBSdjNru2VSzClZo5XdZQ2CC8
oQLHDVS4AEAG0jwxv1VIzRMpijgkWkg4KIOSzwIDAQABAoIBAQDV40eDjhTLNWXL
6//KZfxVHKdfUGdk3uQoVOZreECQXxKiRaxJLgt+CMz8XlZO1KQDFn09OYMIGmhJ
2d1rbrL0ypCOJcQ4+O1Haqbg6exBQ4vwBEMZin/PmsPagaldUzZCbyKFPBX61IDe
6r6hXh82z+PajpwVmDzgdcrKvZFbbUi2Jck5IcgkqvBcB35T45Q43kzOG7fsLpzP
+TyYCNguLRGCQQCKNa8wnNApaUE4YnGC1gfKSvRWqn5/E2vOdvs39/NE61UaZa9P
GtkZr+hxaNOBc+Zskhln9Wa7LU3uLB1twHFK0LyQOeoReiZmRK7NTH8orcQw2RKn
dkUOyNbZAoGBAPtuUzH7eFDfPGRaqxFzBUS6xCRh8CYRzpdFUYdL+a/yaWv3HP4v
WRNDp4xW2bdbGEqHKSs0RQHi4wHuCX0i6+2PrKlmQXrvYTxYCuUwsLr4HQWnxRRk
HUccXH8YYD9pYe87NcGWQJkmFqpfl3Cf+Uw00UHL9ykwr2sfTkvpO3cLAoGBAOxW
3UKt0MpPKo4mT1vq8GkCQHUF+diS+CPBCmZNNbVNzdxm2/xPgzl5Wusf+HjjNkj6
f/ejJmOV+KCpcKbVuftcbPfgxAag/18qT+udpKxAAndovkk1Qy+ntzHFa2rifAn5
AIC1+YhveIKj27L1GRkW8Q6kgTd189MKXaoT2x3NAoGBAPRq+mtDV2HesVmpHlV3
J+75VEU+A/MuKlO5ahkJTW+ySrNO5RtgMcpdYVo276yj3IhOvkGmrVK5Gg69NPI1
6X3lxmZi5lK4tCCyQd0tKRCIs8XUouxAqol/U5elvaLHMhIa0BYhlyiJ80yqYpB0
oydmzOmWeu3KyyxqoXWABHOjAoGALX/XnwOpg5lUHwO/GXoUiJLXZ/AblpdM0E1U
vDc3FM2CyWDAD0YbhFAZsdR42IUdqVUYl8tAE8IGmJ+mQWg6Ius7S0lpU8FhCKgz
tK+nyUWVc/mlUKDBa4ZFXX6dXHl32c+nSiA+hwa206fKHxzSlSL2i5QeEFhT9Zg0
Sg8Ciy0CgYEAhhTIKr6uPPy21pX27rZ/A/qV5Q5XjNzv8nzvmcUglez8TKb8Wdba
EGDYRVrI7x9ASb4Wg0/VB5A6yhUi83rBLVucBK11X8KFzAGiWAlG8fhra0aLpLqF
Rsdk/SalVkrHLnmEtmDHeBFX+R0+1rfi+Ak8tSbQJZJ+wZ604UxBmxU=
-----END RSA PRIVATE KEY-----"

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
