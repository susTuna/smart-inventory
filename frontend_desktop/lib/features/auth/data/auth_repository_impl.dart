import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_desktop/core/network/api_client.dart';
import 'package:frontend_desktop/core/storage/storage_service.dart';
import 'package:frontend_desktop/features/auth/domain/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    apiClient: ref.watch(apiClientProvider),
    storage: ref.watch(storageServiceProvider),
  );
});

final apiClientProvider = Provider<ApiClient>((ref) {
  throw UnimplementedError("ApiClient not initialized");
});

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient apiClient;
  final StorageService storage;

  AuthRepositoryImpl({required this.apiClient, required this.storage});

  @override
  Future<void> login(String username, String password) async {
    try {
      final response = await apiClient.client.post(
        '/login',
        data: {'username': username, 'password': password},
      );

      final data = response.data['data'];
      final token = data['token'];

      if (token != null) {
        await storage.saveToken(token);
      } else {
        throw Exception('Token missing in response');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Invalid Credentials');
      }
      throw Exception(e.message);
    }
  }

  @override
  Future<void> logout() async {
    await storage.clearToken();
  }

  @override
  Future<bool> checkAuthStatus() async {
    return storage.hasToken;
  }
}
