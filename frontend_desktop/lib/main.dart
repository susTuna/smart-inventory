import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_desktop/core/network/api_client.dart';
import 'package:frontend_desktop/core/storage/storage_service.dart';
import 'package:frontend_desktop/features/auth/data/auth_repository_impl.dart';
import 'package:frontend_desktop/features/auth/presentation/login_screen.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:window_manager/window_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await windowManager.ensureInitialized();
  WindowOptions windowOptions = const WindowOptions(
    size: Size(1280, 720),
    center: true,
    title: 'Smart Inventory Manager',
  );
  windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
  });

  final prefs = await SharedPreferences.getInstance();
  final storageService = StorageService(prefs);
  const String envBaseUrl = String.fromEnvironment('BASE_URL');
  final apiClient = ApiClient(
    prefs, 
    baseUrl: envBaseUrl
  );
  

  runApp(
    ProviderScope(
      overrides: [
        storageServiceProvider.overrideWithValue(storageService),
        apiClientProvider.overrideWithValue(apiClient),
      ],
      child: const SmartInventoryApp(),
    ),
  );
}

final _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const Scaffold(body: Center(child: Text("Dashboard Placeholder"))),
    ),
  ],
  redirect: (context, state) {
    return null;
  },
);

class SmartInventoryApp extends StatelessWidget {
  const SmartInventoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Smart Inventory',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light
        ),
        inputDecorationTheme: const InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(),
          labelStyle: TextStyle(color: Colors.black87),
          hintStyle: TextStyle(color: Colors.black54),
        ),
        textTheme: GoogleFonts.robotoTextTheme(),
      ),
      routerConfig: _router,
    );
  }
}