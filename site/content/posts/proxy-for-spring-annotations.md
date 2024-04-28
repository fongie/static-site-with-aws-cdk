+++ 
draft = false
date = 2024-04-28T15:27:02+02:00
title = "Using Spring Boot proxy annotations with anonymous functions"
description = "How to use Spring proxy annotations without having to call methods outside of a class"
slug = "spring-proxy-annotations-helper"
authors = ["Max Körlinge"]
tags = ["spring", "boot", "proxy", "annotations", "transactional", "async"]
categories = ["spring boot"]
externalLink = ""
series = ["spring boot"]
+++

# Using Spring Boot proxy annotations with anonymous functions or class members

If you're like me, you've likely encountered the frustrating reality that calling a method within the same class with annotations like `@Transactional` or `@Async` results in the method executing like any normal method, with the annotations being effectively ignored. This behavior occurs because Spring relies on proxies to manage these annotations, a topic widely discussed in numerous blog posts and StackOverflow questions. The question then becomes: how can you circumvent this?

The most straightforward and natively supported solution is to place the method in a different class. However, there are often compelling reasons to invoke a method within the same class, making this approach less than ideal. You might find recommendations on StackOverflow to switch to an Aspect-Oriented Programming (AOP) based proxying library that supports such functionality. While this can be an effective solution, it may seem excessive to overhaul your entire transaction and proxy management system for a seemingly minor functionality.

I've devised a solution that provides a standardized way to handle this across your application. As with many aspects of Spring, there are likely various other methods to achieve this, but if you were searching for a straightforward approach, here's one to consider!

## Transaction Helper

Here's a full `TransactionHelper` that we can use to accomplish this.

```java
@Slf4j
@Service
public class TransactionHelper {

  /**
   * Run a function in a transaction with Propagation.REQUIRES_NEW.
   *
   * @param func
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void runInNewTransaction(Runnable func) {
    func.run();
  }

  /**
   * Run a function in a transaction with Propagation.REQUIRES_NEW and return the result.
   *
   * @param func
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public <T> T runInNewTransactionAndReturn(Callable func, Class<T> clazz) {
    try {
      return (T) func.call();
    } catch (Exception e) {
      log.error("New transaction and return failed", e);
      return null;
    }
  }

  /**
   * Run a function async and in a transaction with Propagation.REQUIRES_NEW.
   *
   * @param func
   * @return
   */
  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public CompletableFuture<Boolean> runAsyncInNewTransaction(Runnable func) {
    try {
      func.run();
      return CompletableFuture.completedFuture(true);
    } catch (Exception e) {
      log.error("Failed async job", e);
      return CompletableFuture.failedFuture(e);
    }
  }

  /**
   * Run a function async, in a transaction with Propagation.REQUIRES_NEW, and return the result
   * wrapped in a CompletableFuture.
   *
   * @param func
   * @return
   */
  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public <T> CompletableFuture<T> runAsyncInNewTransactionAndReturn(Callable func, Class<T> clazz) {
    try {
      var res = (T) func.call();
      return CompletableFuture.completedFuture(res);
    } catch (Exception e) {
      log.error("New async transaction and return failed", e);
      return CompletableFuture.failedFuture(e);
    }
  }
}
```

## Usage

And here's how it can be used:

```java
      transactionHelper.runInNewTransaction(
          () -> {
            // whatever code you put here will run in a new transaction. no need to call any function outside of this class
          }
      );
```

You want to return something? No problem!

```java
      var myObj = transactionHelper.runInNewTransactionAndReturn(
          () -> {
            return new MyObj();
          }, MyObj.class
      );
```

There are also async variants in the helper, which work the same way (.. but asynchronously).

Of course, you can add more methods for other proxy annotations or variants on them.

## Conclusion

A utility class like this can get you around the problem of using Spring proxy annotations for class members or anonymous methods. Hope you found it useful!