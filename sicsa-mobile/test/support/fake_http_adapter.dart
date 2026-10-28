import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

typedef FakeResponder = ResponseBody Function(RequestOptions options);

class FakeHttpAdapter implements HttpClientAdapter {
  FakeHttpAdapter(this.responder);

  final FakeResponder responder;
  final List<RequestOptions> requests = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return responder(options);
  }

  @override
  void close({bool force = false}) {}

  static ResponseBody json(Object? body, {int statusCode = 200}) =>
      ResponseBody.fromString(
        jsonEncode(body),
        statusCode,
        headers: {
          Headers.contentTypeHeader: ['application/json'],
        },
      );
}
