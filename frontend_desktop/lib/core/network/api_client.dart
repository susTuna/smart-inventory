import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String kAuthTokenKey = 'auth_token';

class ApiClient {
  final Dio _dio;
  final SharedPreferences _prefs;

  static const String _defaultBaseUrl = 'http://localhost:8080/api/v1';

  ApiClient(this._prefs, {String baseUrl = _defaultBaseUrl})
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
          headers: {'Content-Type': 'application/json'},
        ),
      ) {
    _dio.interceptors.add(_authInterceptor());

    assert(() {
      _dio.interceptors.add(
        LogInterceptor(responseBody: true, requestBody: true),
      );
      return true;
    }());
  }

  Dio get client => _dio;

  InterceptorsWrapper _authInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _prefs.getString(kAuthTokenKey);

        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        return handler.next(options);
      },
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401) {/* will add logic later */}
        return handler.next(e);
      },
    );
  }
}
