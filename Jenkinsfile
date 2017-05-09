IMAGE_NAME = "tadashi-aikawa/jumeaux-viewer"

node {
    withCredentials([
        [$class: 'StringBinding', credentialsId: 'GHP_TOKEN', variable: 'GHP_TOKEN']
    ]) {
        stage('Checkout') { checkout scm }

        try {
            stage('Build') {
                sh "sudo docker build -t $IMAGE_NAME ."
            }

            stage('Packaging and deploy github pages') {
                sh """
                   sudo docker run -v `pwd`:/mount-tmp \
                                   -e GHP_TOKEN=${env.GHP_TOKEN} \
                                   --privileged --rm \
                                   tadashi-aikawa/jumeaux-viewer /mount-tmp/deploy.sh
                """
            }

            slackSend color: 'good', message: "${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
        } catch (e) {
            currentBuild.result = 'FAILURE'
            slackSend color: 'danger', message: "${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
        }

    }
}
