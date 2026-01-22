import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_desktop/core/network/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError("Initialize this in main.dart");
});

class StorageService {
  final SharedPreferences _prefs;

  StorageService(this._prefs);

  Future<void> saveToken(String token) async {
    await _prefs.setString(kAuthTokenKey, token);
  }

  String? getToken() {
    return _prefs.getString(kAuthTokenKey);
  }

  Future<void> clearToken() async {
    await _prefs.remove(kAuthTokenKey);
  }

  bool get hasToken => _prefs.containsKey(kAuthTokenKey);
}
