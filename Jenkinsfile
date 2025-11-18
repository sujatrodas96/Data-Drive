pipeline {
    agent any

    environment {
        IMAGE_NAME = "data-drive-container"
        EC2_HOST = "98.81.152.233"
        SCANNER_HOME = tool 'sonar-cube'   // SonarScanner tool
    }

    stages {

        /* =============== CHECKOUT =============== */
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/sujatrodas96/Data-Drive.git'
            }
        }

        /* =============== SONARCLOUD SCAN =============== */
        stage('SonarCloud Scan') {
            steps {
                withCredentials([
                    string(credentialsId: 'SONAR_TOKEN_NEW', variable: 'SONAR_TOKEN'),
                    string(credentialsId: 'SONAR_ORG', variable: 'SONAR_ORG'),
                    string(credentialsId: 'SONAR_PROJECT_KEY', variable: 'SONAR_PROJECT_KEY')
                ]) {
                    withSonarQubeEnv('SonarCloud') {  // ← Add this wrapper
                        sh """
                            ${SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.organization=$SONAR_ORG \
                            -Dsonar.projectKey=$SONAR_PROJECT_KEY \
                            -Dsonar.sources=.
                        """
                    }
                }
            }
        }

        /* =============== QUALITY GATE (DO NOT FAIL PIPELINE) =============== */
        stage("Quality Gate") {
            steps {
                timeout(time: 1, unit: 'MINUTES') {
                    script {
                        def qg = waitForQualityGate()
                        echo "Quality Gate Status: ${qg.status}"

                        if (qg.status != 'OK') {
                            echo "Sonar Quality Gate FAILED — but pipeline will continue."
                        }
                    }
                }
            }
        }

        /* =============== TRIVY SECURITY SCAN =============== */
        stage('Trivy Scan') {
            steps {
                sh '''
                    echo "Running Trivy vulnerability scan..."
                    trivy fs --exit-code 0 --severity HIGH,CRITICAL .
                '''
            }
        }

        /* =============== SNYK SECURITY SCAN =============== */
        stage('Snyk Security Scan') {
            steps {
                withCredentials([string(credentialsId: 'SNYK_TOKEN', variable: 'SNYK_TOKEN')]) {
                    sh '''
                        echo "Running Snyk SAST & Dep Scan..."
                        snyk auth $SNYK_TOKEN
                        snyk test --severity-threshold=medium || true
                        snyk monitor || true
                    '''
                }
            }
        }

        /* =============== DOCKER BUILD =============== */
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        /* =============== DOCKER PUSH =============== */
        stage('DockerHub Login & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-cred',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker tag data-drive-container:latest "$DOCKER_USER/data-drive-container:latest"
                        docker push "$DOCKER_USER/data-drive-container:latest"
                        docker logout
                    '''
                }
            }
        }

        /* =============== DEPLOY TO EC2 =============== */
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
                    string(credentialsId: 'SUPABASE_URL',         variable: 'SUPABASE_URL'),
                    string(credentialsId: 'SUPABASE_ANON_KEY',    variable: 'SUPABASE_ANON_KEY'),
                    string(credentialsId: 'SUPABASE_BUCKET',      variable: 'SUPABASE_BUCKET'),
                    string(credentialsId: 'MONGO_URL',            variable: 'MONGO_URL')
                ]) {
                    sh '''
                        chmod 600 "$SSH_KEY"

                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USER"@"${EC2_HOST}" "
                            echo '$DOCKER_PASS' | docker login -u '$DOCKER_USER' --password-stdin

                            docker stop data-drive 2>/dev/null || true
                            docker rm data-drive 2>/dev/null || true

                            docker pull '$DOCKER_USER/data-drive-container:latest'

                            docker run -d -p 3000:3000 --name data-drive --restart unless-stopped \
                                -e SUPABASE_URL='$SUPABASE_URL' \
                                -e SUPABASE_ANON_KEY='$SUPABASE_ANON_KEY' \
                                -e SUPABASE_BUCKET='$SUPABASE_BUCKET' \
                                -e MONGO_URL='$MONGO_URL' \
                                -e PORT=3000 \
                                '$DOCKER_USER/data-drive-container:latest'

                            docker ps -a
                            docker logout
                        "
                    '''
                }
            }
        }
    }

    /* =============== POST BUILD =============== */
    post {
        success {
            echo "Deployment Successful → http://${EC2_HOST}:3000"
        }
        failure {
            echo "Deployment Failed!"
        }
        always {
            sh 'docker logout || true'
        }
    }
}
