//
//  LogInView.swift
//  BinBot
//
//  Created by Sbeve on 02/08/2024.
//

import SwiftUI

struct LogInView: View {
    @Binding var UserId: String
    @Environment(\.colorScheme) var colorScheme
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
            
            if (colorScheme == .dark){
                Button {
                    withAnimation {
                        UserId = "1234"
                    }
                } label: {
                    Label("Continue with Apple", systemImage: "applelogo")
                        .frame(maxWidth: .infinity)
                        .colorInvert()
                }
                .buttonStyle(.borderedProminent)
                .tint(.white)
                .cornerRadius(/*@START_MENU_TOKEN@*/10.0/*@END_MENU_TOKEN@*/)
            } else {
                Button {
                    withAnimation {
                        UserId = "1234"
                    }
                } label: {
                    Label("Continue with Apple", systemImage: "applelogo")
                        .frame(maxWidth: .infinity)
                        
                }
                .buttonStyle(.borderedProminent)
                .tint(.black)
                .cornerRadius(/*@START_MENU_TOKEN@*/10.0/*@END_MENU_TOKEN@*/)
            }
            

        }
        .padding()
    }
}

#Preview {
    BaseView()
}
