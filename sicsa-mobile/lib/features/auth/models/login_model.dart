class LoginModel {
  final String identifier;
  final String password;

  LoginModel({
    required this.identifier,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': identifier,
      'password': password,
    };
  }
}
