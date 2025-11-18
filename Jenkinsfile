pipeline {
    agent any

    environment {
        IMAGE_NAME = "data-drive-container"
        EC2_HOST = "98.81.152.233"
        SCANNER_HOME = tool 'sonar-cube'
    }

    stages {

        /* ----------------------- CHECKOUT ----------------------- */
        stage('Checkout') {
            steps {
                echo "Cloning repository..."
                git branch: 'main', url: 'https://github.com/sujatrodas96/Data-Drive.git'
            }
        }

        /* ------------------ SONARCLOUD ANALYSIS ------------------ */
        stage('SonarCloud Scan') {
            steps {
                withCredentials([
                    string(credentialsId: 'SONAR_TOKEN_NEW', variable: 'SONAR_TOKEN_NEW'),
                    string(credentialsId: 'SONAR_URL', variable: 'SONAR_URL'),
                    string(credentialsId: 'SONAR_ORG', variable: 'SONAR_ORG'),
                    string(credentialsId: 'SONAR_PROJECT_KEY', variable: 'SONAR_PROJECT_KEY')
                ]) {
                    sh '''
                        echo "Running SonarCloud Scanner..."

                        ${SCANNER_HOME}/bin/sonar-scanner \
                          -Dsonar.organization=$SONAR_ORG \
                          -Dsonar.projectKey=$SONAR_PROJECT_KEY \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=$SONAR_URL \
                          -Dsonar.login=$SONAR_TOKEN_NEW
                    '''
                }
            }
        }

        /* ----------- WAIT FOR SONARCLOUD QUALITY GATE ---------------- */
        stage('Quality Gate') {
            steps {
                script {
                    def qg = waitForQualityGate()
                    if (qg.status != 'OK') {
                        currentBuild.result = "UNSTABLE"
                        echo "Quality Gate failed, but marking as UNSTABLE and continuing..."
                    }
                }
            }
        }




        /* -------------------- SNYK SECURITY SCAN -------------------- */
        stage('Snyk Security Scan') {
            steps {
                withCredentials([string(credentialsId: 'SNYK_TOKEN', variable: 'SNYK_TOKEN')]) {
                    sh '''
                        echo "Running Snyk SAST + Dependency Scan..."
                        snyk auth $SNYK_TOKEN
                        snyk test --severity-threshold=medium || true
                        snyk monitor || true
                    '''
                }
            }
        }

        /* -------------------- DOCKER BUILD ---------------------- */
        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                sh '''
                    docker build -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        /* -------------------- TRIVY VULNERABILITY SCAN -------------------- */
        stage('Trivy Scan') {
            steps {
                echo "Running Trivy vulnerability scan on Docker image..."
                sh '''
                    trivy image --severity HIGH,CRITICAL --exit-code 0 ${IMAGE_NAME}:latest

                    # If you want pipeline to FAIL on HIGH/CRITICAL, change above to:
                    # trivy image --severity HIGH,CRITICAL --exit-code 1 ${IMAGE_NAME}:latest
                '''
            }
        }

        /* ------------------ PUSH TO DOCKER HUB ------------------ */
        stage('DockerHub Login & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker tag ${IMAGE_NAME}:latest "$DOCKER_USER/${IMAGE_NAME}:latest"
                        docker push "$DOCKER_USER/${IMAGE_NAME}:latest"
                        docker logout
                    '''
                }
            }
        }

        /* ---------------------- DEPLOY TO EC2 ---------------------- */
        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    ),
                    usernamePassword(
                        credentialsId: 'dockerhub-cred',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    ),
                    string(credentialsId: 'SUPABASE_URL', variable: 'SUPABASE_URL'),
                    string(credentialsId: 'SUPABASE_ANON_KEY', variable: 'SUPABASE_ANON_KEY'),
                    string(credentialsId: 'SUPABASE_BUCKET', variable: 'SUPABASE_BUCKET'),
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL')
                ]) {
                    sh '''
                        chmod 600 "$SSH_KEY"

                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USER"@"${EC2_HOST}" "
                            echo '$DOCKER_PASS' | docker login -u '$DOCKER_USER' --password-stdin

                            docker stop data-drive 2>/dev/null || true
                            docker rm data-drive 2>/dev/null || true

                            docker pull '$DOCKER_USER/${IMAGE_NAME}:latest'

                            docker run -d -p 3000:3000 --name data-drive --restart unless-stopped \
                                -e SUPABASE_URL='$SUPABASE_URL' \
                                -e SUPABASE_ANON_KEY='$SUPABASE_ANON_KEY' \
                                -e SUPABASE_BUCKET='$SUPABASE_BUCKET' \
                                -e MONGO_URL='$MONGO_URL' \
                                -e PORT=3000 \
                                '$DOCKER_USER/${IMAGE_NAME}:latest'

                            docker ps | grep data-drive || echo 'Container failed to run'

                            docker logout
                        "
                    '''
                }
            }
        }
    }

    /* ---------------------------- POST BUILD ---------------------------- */
    post {
        success {
            echo "Deployment successful! App running at http://${EC2_HOST}:3000"
        }
        failure {
            echo "Deployment failed!"
        }
        always {
            echo "Cleaning up local Docker login..."
            sh 'docker logout 2>/dev/null || true'
        }
    }
}
