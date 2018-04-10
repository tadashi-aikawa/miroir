import {Component, OnInit} from '@angular/core';
import {AwsService} from '../../services/aws-service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    accessKeyId: string;
    secretAccessKey: string;
    useLocalStack = this.awsService.useLocalStack;
    localStackEndpoint = this.awsService.localStackEndpoint;
    returnUrl: string;
    authenticating: boolean;
    errorMessage: undefined;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private awsService: AwsService) {
        // DO NOTHING
    }

    ngOnInit() {
        this.awsService.logout();
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    login() {
        this.errorMessage = undefined;
        this.authenticating = true;
        this.awsService.login(this.accessKeyId, this.secretAccessKey, this.useLocalStack, this.localStackEndpoint)
            .then(() => {
                this.authenticating = false;
                this.router.navigateByUrl(this.returnUrl);
            })
            .catch(err => {
                this.authenticating = false;
                this.errorMessage = err.message;
            });
    }
}
