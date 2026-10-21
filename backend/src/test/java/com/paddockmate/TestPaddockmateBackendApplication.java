package com.paddockmate;

import org.springframework.boot.SpringApplication;

public class TestPaddockmateBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(PaddockmateBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
