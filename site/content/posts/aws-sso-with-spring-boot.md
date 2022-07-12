+++ 
draft = false
date = 2022-07-12T14:25:03+02:00
title = "Use AWS SSO to authenticate with Spring Boot"
description = "How to set up Spring Boot to use AWS SSO SAML for login"
slug = "aws-sso-spring-boot"
authors = ["Max Körlinge"]
tags = ["aws","sso","spring", "boot", "login", "saml"]
categories = ["spring boot"]
externalLink = ""
series = ["spring boot"]
+++

# Use AWS SSO to authenticate with Spring Boot

At [Alex](https://www.alextherapeutics.com/) we are developing an internal tool to facilitate creating our apps, and we thought it would make sense to try using our existing AWS SSO setup to login to this service. As usual, it is indeed simple if you know how to do it, but we came across some stumbling blocks so here’s a guide on how to do it.

## Instructions

1. Prepare your Spring Boot application

AWS SSO is a SAML identity provider (IdP), and you are building a service provider. You will need the Spring Boot SAML dependency as well as Spring security.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-saml2-service-provider</artifactId>
</dependency>
```

Next, you need to prepare your properties. Here’s a sample `yml`:

```yaml
spring:
  security:
    saml2:
      relyingparty:
        registration:
          aws:
            signing.credentials:
              - private-key-location: classpath:credentials/key.pem
                certificate-location: classpath:credentials/cert.pem
            identityprovider:
                metadata-uri: ${METADATA_URI}
```

Here, we tell Spring SAML the location of our applications private key and certificate, and we also tell it where to find the identity provider (AWS SSO) metadata using the environment variable ``METADATA_URI`` which we will find and set later.

Let’s go ahead and create our private key and certificate right away. Browse to your ``resources/credentials`` folder, run this and follow the instructions:

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 700 -nodes
```

This will get you a self-signed certificate to send your SAML assertions with.

Lastly, you need a security config in your application:

```java
@Configuration
public class SecurityConfig {
    @Bean
        SecurityFilterChain app(HttpSecurity http) throws Exception {
            http
                .authorizeHttpRequests((authorize) -> authorize
                        .anyRequest().authenticated()
                        )
                .saml2Login(Customizer.withDefaults())
                .saml2Logout(Customizer.withDefaults());

            return http.build();
        }

    @Bean
        RelyingPartyRegistrationResolver relyingPartyRegistrationResolver(
                RelyingPartyRegistrationRepository registrations) {
            return new DefaultRelyingPartyRegistrationResolver((id) -> registrations.findByRegistrationId("aws"));
        }

    @Bean
        FilterRegistrationBean<Saml2MetadataFilter> metadata(RelyingPartyRegistrationResolver registrations) {
            Saml2MetadataFilter metadata = new Saml2MetadataFilter(registrations, new OpenSamlMetadataResolver());
            FilterRegistrationBean<Saml2MetadataFilter> filter = new FilterRegistrationBean<>(metadata);
            filter.setOrder(-101);
            return filter;
        }
}
```

The config says all HTTP requests will need to be authenticated using SAML, it configures the SAML dependency to use the relying party called “aws” which we defined in the ``yml``, and we enable our application to provide a metadata endpoint where we can download our service provider’s metadata from.

2. Prepare AWS SSO

Open your AWS console and go to AWS SSO. Create a Custom Application. You will see a bunch of information. Copy the AWS SSO SAML metadata file URL and note it down somewhere, so we can set the environment variable METADATA_URI later.

Next, from the same page download the AWS SSO certificate and move it to `src/main/resources/credentials/idp-certificate.crt`. This is actually the step that confused me the most since I couldn’t find it documented anywhere, but this location is the default for Spring SAML to look for the IdP certificate.

Now we need to fetch our own metadata to upload to AWS. To do this, you must start your application. Remember to set the ``METADATA_URI`` environment variable to the AWS SSO endpoint you saved before. When your app is running, browse to`{baseUri}:8080/saml2/service-provider-metadata/aws`
(for example `http://localhost:8080/saml2/service-provider-metadata/aws`) and download your metadata file, this will be an XML file.

Go back to AWS SSO and upload the metadata file. This automatically configures AWS SSO to use the correct endpoints in your application for the SAML assertions. Save the configuration.

Next, you need to authorize your SSO users to access your application. Go to Assigned users and assign your user to this custom application.

Lastly, in AWS SSO,  go to Attribute mappings and map the Subject attribute to `${user:subject}` with format `unspecified` and save.

3. Enjoy!

You are now fully set up! Browse to an endpoint on your application and it should direct to AWS SSO. Log in with the user you gave access to. You should be authorized and arrive at your endpoint!

## Summary

In this post we have set up Spring boot SAML login with AWS SSO as the identity provider. There is a proof of concept application here: https://github.com/fongie/aws-sso-spring with additional instructions in the read me.
