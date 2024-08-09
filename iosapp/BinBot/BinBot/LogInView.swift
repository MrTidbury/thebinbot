//
//  LogInView.swift
//  BinBot
//
//  Created by Sbeve on 02/08/2024.
//

import SwiftUI
import AuthenticationServices

struct LogInView: View {
    @Binding var UserId: String
    @Environment(\.colorScheme) var colorScheme
    @AppStorage("email") var email: String = ""
    @AppStorage("firstName") var firstName: String = ""
    @AppStorage("lastName") var lastName: String = ""
    
    
    var body: some View {
        VStack {
            Spacer()
            if (colorScheme == .dark){
                Image("logo-dark")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .foregroundStyle(.tint)
            } else {
                Image("logo-light")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .foregroundStyle(.tint)
            }
            
            Spacer()
            
            SignInWithAppleButton(.continue) { request in
                request.requestedScopes = [.email, .fullName]
            } onCompletion: { result in
                switch result {
                case .success(let auth):
                    switch auth.credential {
                    case let credential as ASAuthorizationAppleIDCredential:
                        // This is the basic ID get this everytime
                        let loggedInUserID = credential.user
                        // Will not get this again after first sign in
                        let loggedInemail = credential.email
                        let loggedInfirstName = credential.fullName?.givenName
                        let loggedInlastName = credential.fullName?.familyName
                        
                        if ((loggedInemail) != nil){
                            email = loggedInemail ?? ""
                        }
                        if ((loggedInfirstName) != nil){
                            firstName = loggedInfirstName ?? ""
                        }
                        if ((loggedInlastName) != nil){
                            lastName = loggedInlastName ?? ""
                        }
                        
                        
                        withAnimation(.easeInOut, {
                            UserId = loggedInUserID

                        })
                        
                    default:
                        break
                    }
                case .failure(let error):
                    print(error)
                }
            }
            .signInWithAppleButtonStyle(
                colorScheme == .dark ? .white : .black
            )
            .frame(height: 50)
            .padding()
            .cornerRadius(8)
        }
        .padding()
    }
}

#Preview {
    BaseView()
}
