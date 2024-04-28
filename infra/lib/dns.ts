import { Stack, StackProps } from "aws-cdk-lib";
import { HostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface DnsProps extends StackProps {

}

export class Dns extends Stack {
    private _com_maxkorlinge: HostedZone;
    private _com_maxkörlinge: HostedZone;
    private _se_maxkörlinge: HostedZone;
    private _se_maxk: HostedZone;
    constructor(scope: Construct, id: string, props: DnsProps) {
        super(scope, id, props);

        this._com_maxkorlinge = new PublicHostedZone(this, 'com-maxkorlinge', {
            zoneName: 'maxkorlinge.com',
            caaAmazon: true
        });
        this._com_maxkörlinge = new PublicHostedZone(this, 'com-maxkoerlinge', {
            zoneName: 'xn--maxkrlinge-hcb.com',
            caaAmazon: true
        });
        this._se_maxkörlinge = new PublicHostedZone(this, 'se-maxkoerlinge', {
            zoneName: 'xn--maxkrlinge-hcb.se',
            caaAmazon: true
        });
        this._se_maxk = new PublicHostedZone(this, 'se-maxk', {
            zoneName: 'maxk.se',
            caaAmazon: true
        });

    }
    public get com_maxkorlinge(): HostedZone {
        return this._com_maxkorlinge;
    }
    public get com_maxkörlinge(): HostedZone {
        return this._com_maxkörlinge;
    }
    public get se_maxkörlinge(): HostedZone {
        return this._se_maxkörlinge;
    }
    public get se_maxk(): HostedZone {
        return this._se_maxk;
    }
}